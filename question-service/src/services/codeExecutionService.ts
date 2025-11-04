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
import re
import inspect

${code}

# Read test cases from file (will be replaced with actual file path)
test_cases = []

results = []
for idx, test_case in enumerate(test_cases):
    try:
        # Parse input
        input_data = test_case['input']
        nums = None
        target = None
        
        # Handle different input formats
        # Ensure input_data is a string
        if not isinstance(input_data, str):
            input_data = str(input_data)
        
        # Format 1: "nums = [2,7,11,15], target = 9"
        if 'nums =' in input_data and 'target =' in input_data:
            nums_match = re.search(r'nums\s*=\s*(\[.*?\])', input_data)
            target_match = re.search(r'target\s*=\s*(-?\d+)', input_data)
            if nums_match and target_match:
                try:
                    nums = json.loads(nums_match.group(1).strip())
                    target = int(target_match.group(1))
                except:
                    pass
        # Format 2: "[2,7,11,15] 9" (array string followed by space and target)
        elif isinstance(input_data, str) and input_data.strip().startswith('[') and ' ' in input_data:
            # Split by space - last part should be target, first part should be array
            parts = input_data.rsplit(' ', 1)
            if len(parts) == 2:
                try:
                    nums_str = parts[0].strip()
                    target_str = parts[1].strip()
                    nums = json.loads(nums_str)
                    target = int(target_str)
                except:
                    pass
        # Format 3: Try to parse as JSON array with 2 elements
        elif isinstance(input_data, str):
            try:
                parsed = json.loads(input_data)
                if isinstance(parsed, list) and len(parsed) == 2:
                    nums = parsed[0]
                    target = parsed[1]
                else:
                    input_data = parsed
            except:
                pass
        
        # Call solution function
        # If we have nums and target, pass them as separate arguments
        if 'solution' in globals():
            # Priority: use extracted nums and target if available
            if nums is not None and target is not None:
                result = solution(nums, target)
            else:
                # Fallback: try to determine function signature
                try:
                    sig = inspect.signature(solution)
                    param_count = len(sig.parameters)
                    
                    if param_count == 2:
                        # Function expects 2 parameters
                        if isinstance(input_data, list) and len(input_data) == 2:
                            result = solution(input_data[0], input_data[1])
                        else:
                            # Try to parse input_data as JSON if it's a string
                            if isinstance(input_data, str):
                                try:
                                    parsed = json.loads(input_data)
                                    if isinstance(parsed, list) and len(parsed) == 2:
                                        result = solution(parsed[0], parsed[1])
                                    else:
                                        result = solution(input_data)
                                except:
                                    result = solution(input_data)
                            else:
                                result = solution(input_data)
                    elif param_count == 1:
                        result = solution(input_data)
                    else:
                        # Last resort: try with input_data as single argument
                        result = solution(input_data)
                except Exception as e:
                    # If signature inspection fails, try with input_data
                    result = solution(input_data)
        elif 'main' in globals():
            import inspect
            sig = inspect.signature(main)
            param_count = len(sig.parameters)
            
            if nums is not None and target is not None:
                result = main(nums, target)
            elif param_count == 2 and isinstance(input_data, list) and len(input_data) == 2:
                result = main(input_data[0], input_data[1])
            elif param_count == 1:
                result = main(input_data)
            else:
                result = main(input_data)
        else:
            raise Exception("No solution or main function found")
        
        # Convert result to string
        if isinstance(result, (list, dict)):
            result_str = json.dumps(result, separators=(',', ':'))  # No spaces after commas
        else:
            result_str = str(result)
        
        # Normalize both outputs for comparison (remove all whitespace differences)
        expected_normalized = test_case['expectedOutput'].strip().replace(' ', '').replace('\n', '').replace('\t', '')
        actual_normalized = result_str.strip().replace(' ', '').replace('\n', '').replace('\t', '')
        
        passed = actual_normalized == expected_normalized
        
        results.append({
            'input': test_case['input'],
            'expectedOutput': test_case['expectedOutput'],
            'actualOutput': result_str,
            'passed': passed,
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
      // Write test cases to a separate file for Python to read
      const testCasesFile = path.join(this.TEMP_DIR, `testcases_${Date.now()}.json`);
      fs.writeFileSync(testCasesFile, JSON.stringify(testCases));

      // Modify Python code to read from file
      const pythonCodeWithFile = pythonCode.replace(
        '# Read test cases from file (will be replaced with actual file path)\ntest_cases = []',
        `test_cases = json.load(open('${testCasesFile}', 'r'))`
      );

      // Write Python script to temp file (after replacement)
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

