import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface ExecutionResult {
  results: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    testCaseNumber: number;
  }>;
  output: string;
}

export class CodeExecutionService {
  private readonly MAX_EXECUTION_TIME = 10000; // 10 seconds
  private readonly TEMP_DIR = os.tmpdir();

  async executeCode(
    code: string,
    language: string,
    testCases: TestCase[]
  ): Promise<ExecutionResult> {
    const results: ExecutionResult["results"] = [];
    let output = "Running your code...\n\n";

    try {
      switch (language.toLowerCase()) {
        case "python":
        case "py":
          return await this.executePython(code, testCases);
        case "javascript":
        case "js":
          return await this.executeJavaScript(code, testCases);
        case "java":
          return await this.executeJava(code, testCases);
        case "cpp":
        case "c++":
          return await this.executeCpp(code, testCases);
        default:
          throw new Error(`Language "${language}" is not supported yet`);
      }
    } catch (error: any) {
      output += `Error: ${error.message}\n`;
      testCases.forEach((testCase, idx) => {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: `Error: ${error.message}`,
          passed: false,
          testCaseNumber: idx + 1,
        });
      });
      return { results, output };
    }
  }

  private async executePython(
    code: string,
    testCases: TestCase[]
  ): Promise<ExecutionResult> {
    const results: ExecutionResult["results"] = [];
    let output = "";

    // Create a Python script that wraps the solution function
    const pythonCode = `
import json
import sys

${code}

# Read test cases from stdin
test_cases = json.load(sys.stdin)

results = []
for idx, test_case in enumerate(test_cases):
    try:
        # Parse input
        input_data = test_case['input']
        try:
            input_data = json.loads(input_data)
        except:
            pass
        
        # Call solution function
        if 'solution' in globals():
            result = solution(input_data)
        elif 'main' in globals():
            result = main(input_data)
        else:
            raise Exception("No solution or main function found")
        
        # Convert result to string
        if isinstance(result, (list, dict)):
            result_str = json.dumps(result)
        else:
            result_str = str(result)
        
        results.append({
            'input': test_case['input'],
            'expectedOutput': test_case['expectedOutput'],
            'actualOutput': result_str,
            'passed': result_str.strip() == test_case['expectedOutput'].strip(),
            'testCaseNumber': idx + 1
        })
    except Exception as e:
        results.append({
            'input': test_case['input'],
            'expectedOutput': test_case['expectedOutput'],
            'actualOutput': f'Error: {str(e)}',
            'passed': False,
            'testCaseNumber': idx + 1
        })

print(json.dumps(results))
`;

    const tempFile = path.join(this.TEMP_DIR, `code_${Date.now()}.py`);

    try {
      // Write Python script to temp file
      fs.writeFileSync(tempFile, pythonCode);

      // Write test cases to a separate file for Python to read
      const testCasesFile = path.join(this.TEMP_DIR, `testcases_${Date.now()}.json`);
      fs.writeFileSync(testCasesFile, JSON.stringify(testCases));

      // Modify Python code to read from file
      const pythonCodeWithFile = pythonCode.replace(
        'test_cases = json.load(sys.stdin)',
        `test_cases = json.load(open('${testCasesFile}', 'r'))`
      );
      fs.writeFileSync(tempFile, pythonCodeWithFile);

      // Execute Python with timeout
      const { stdout, stderr } = await Promise.race([
        execAsync(
          `python3 "${tempFile}"`,
          {
            maxBuffer: 1024 * 1024 * 10, // 10MB
          }
        ),
        new Promise<{ stdout: string; stderr: string }>((_, reject) =>
          setTimeout(
            () => reject(new Error("Execution timeout")),
            this.MAX_EXECUTION_TIME
          )
        ),
      ]) as { stdout: string; stderr: string };

      // Clean up test cases file
      if (fs.existsSync(testCasesFile)) {
        fs.unlinkSync(testCasesFile);
      }

      if (stderr && !stderr.includes("DeprecationWarning")) {
        throw new Error(stderr);
      }

      // Parse results
      const parsedResults = JSON.parse(stdout.trim());
      results.push(...parsedResults);
    } catch (error: any) {
      // If execution fails, create error results for all test cases
      testCases.forEach((testCase, idx) => {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: `Error: ${error.message}`,
          passed: false,
          testCaseNumber: idx + 1,
        });
      });
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;

    output += `Results: ${passedCount}/${totalCount} test cases passed.\n\n`;

    results.forEach((result) => {
      output += `Test Case ${result.testCaseNumber}: ${
        result.passed ? "✓ PASSED" : "✗ FAILED"
      }\n`;
      output += `  Input: ${result.input}\n`;
      output += `  Expected: ${result.expectedOutput}\n`;
      output += `  Got: ${result.actualOutput}\n\n`;
    });

    if (passedCount === totalCount) {
      output += "✓ All test cases passed! Well done!";
    } else {
      output += "✗ Some test cases failed. Try again.";
    }

    return { results, output };
  }

  private async executeJavaScript(
    code: string,
    testCases: TestCase[]
  ): Promise<ExecutionResult> {
    const results: ExecutionResult["results"] = [];
    let output = "";

    const jsCode = `
const testCases = JSON.parse(require('fs').readFileSync(0, 'utf-8'));

${code}

const results = [];
for (let idx = 0; idx < testCases.length; idx++) {
    const testCase = testCases[idx];
    try {
        let input = testCase.input;
        try {
            input = JSON.parse(input);
        } catch {}
        
        let result;
        if (typeof solution !== 'undefined') {
            result = solution(input);
        } else if (typeof main !== 'undefined') {
            result = main(input);
        } else {
            throw new Error('No solution or main function found');
        }
        
        let resultStr;
        if (typeof result === 'object' && result !== null) {
            resultStr = JSON.stringify(result);
        } else {
            resultStr = String(result);
        }
        
        results.push({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: resultStr,
            passed: resultStr.trim() === testCase.expectedOutput.trim(),
            testCaseNumber: idx + 1
        });
    } catch (error) {
        results.push({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: 'Error: ' + error.message,
            passed: false,
            testCaseNumber: idx + 1
        });
    }
}

console.log(JSON.stringify(results));
`;

    const tempFile = path.join(this.TEMP_DIR, `code_${Date.now()}.js`);

    try {
      // Write test cases to a separate file for Node.js to read
      const testCasesFile = path.join(this.TEMP_DIR, `testcases_${Date.now()}.json`);
      fs.writeFileSync(testCasesFile, JSON.stringify(testCases));

      // Modify JS code to read from file
      const jsCodeWithFile = jsCode.replace(
        "const testCases = JSON.parse(require('fs').readFileSync(0, 'utf-8'));",
        `const testCases = JSON.parse(require('fs').readFileSync('${testCasesFile}', 'utf-8'));`
      );
      fs.writeFileSync(tempFile, jsCodeWithFile);

      const { stdout, stderr } = await Promise.race([
        execAsync(`node "${tempFile}"`, {
          maxBuffer: 1024 * 1024 * 10,
        }),
        new Promise<{ stdout: string; stderr: string }>((_, reject) =>
          setTimeout(
            () => reject(new Error("Execution timeout")),
            this.MAX_EXECUTION_TIME
          )
        ),
      ]) as { stdout: string; stderr: string };

      // Clean up test cases file
      if (fs.existsSync(testCasesFile)) {
        fs.unlinkSync(testCasesFile);
      }

      if (stderr) {
        throw new Error(stderr);
      }

      const parsedResults = JSON.parse(stdout.trim());
      results.push(...parsedResults);
    } catch (error: any) {
      testCases.forEach((testCase, idx) => {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: `Error: ${error.message}`,
          passed: false,
          testCaseNumber: idx + 1,
        });
      });
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;

    output += `Results: ${passedCount}/${totalCount} test cases passed.\n\n`;

    results.forEach((result) => {
      output += `Test Case ${result.testCaseNumber}: ${
        result.passed ? "✓ PASSED" : "✗ FAILED"
      }\n`;
      output += `  Input: ${result.input}\n`;
      output += `  Expected: ${result.expectedOutput}\n`;
      output += `  Got: ${result.actualOutput}\n\n`;
    });

    if (passedCount === totalCount) {
      output += "✓ All test cases passed! Well done!";
    } else {
      output += "✗ Some test cases failed. Try again.";
    }

    return { results, output };
  }

  private async executeJava(
    code: string,
    testCases: TestCase[]
  ): Promise<ExecutionResult> {
    // Java execution is more complex - would need proper class structure
    // For now, return error
    const results: ExecutionResult["results"] = [];
    testCases.forEach((testCase, idx) => {
      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: "Error: Java execution not yet fully implemented",
        passed: false,
        testCaseNumber: idx + 1,
      });
    });
    return {
      results,
      output: "Java execution is not yet fully implemented. Please use Python or JavaScript for now.",
    };
  }

  private async executeCpp(
    code: string,
    testCases: TestCase[]
  ): Promise<ExecutionResult> {
    // C++ execution is more complex - would need compilation
    // For now, return error
    const results: ExecutionResult["results"] = [];
    testCases.forEach((testCase, idx) => {
      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: "Error: C++ execution not yet fully implemented",
        passed: false,
        testCaseNumber: idx + 1,
      });
    });
    return {
      results,
      output: "C++ execution is not yet fully implemented. Please use Python or JavaScript for now.",
    };
  }
}

export default new CodeExecutionService();

