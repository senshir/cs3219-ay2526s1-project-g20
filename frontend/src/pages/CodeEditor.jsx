import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { initVimMode } from "monaco-vim";
import { endpoints } from "../lib/api";
import "../css/CodeEditor.css";

export default function CodeEditor() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [questionWidth, setQuestionWidth] = useState(400);
  const [codeWidth, setCodeWidth] = useState(null);
  const [chatbotWidth, setChatbotWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(null);
  const [theme, setTheme] = useState("custom-dark");
  const [vimMode, setVimMode] = useState(false);

  const fetchQuestion = async () => {
    try {
      const response = await fetch(`${endpoints.questions}/api/questions/${questionId}`);
      const result = await response.json();
      if (result.success) {
        setQuestion(result.data);
        // Initialize with a default code template
        setCode(getDefaultCode(language, result.data));
      }
    } catch (err) {
      console.error("Error fetching question:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const getDefaultCode = (lang, q) => {
    const templates = {
      python: `def solution():
    # TODO: Implement your solution here
    pass

# Test cases will be provided below
`,
      javascript: `function solution(nums) {
    // TODO: Implement your solution here
    // Example: return nums;
}

// Test cases will be provided below
`,
      java: `public class Solution {
    public void solution() {
        // TODO: Implement your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

void solution() {
    // TODO: Implement your solution here
}

int main() {
    solution();
    return 0;
}
`
    };
    return templates[lang] || templates.python;
  };

  const handleEditorDidMount = (editor, monaco) => {
    // Store monaco globally for theme updates and editor instance
    window.monaco = monaco;
    window.editorInstance = editor;
    
    // Enable word wrap and configure editor
    editor.updateOptions({ wordWrap: 'on' });
    
    // Define custom themes
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d30',
        'editor.selectionBackground': '#264f78'
      }
    });

    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#f0f0f0'
      }
    });
    
    // Set the initial theme
    monaco.editor.setTheme(theme);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(getDefaultCode(newLang, question));
  };

  const executeJavaScript = (code, testCases) => {
    const results = [];
    let output = "Running your code...\n\n";
    
    try {
      // Execute user code to define functions/variables
      eval(code);
      
      // Find the solution function
      let solutionFunc = null;
      if (typeof solution !== 'undefined') {
        solutionFunc = solution;
      } else if (typeof main !== 'undefined') {
        solutionFunc = main;
      }
      
      if (!solutionFunc || typeof solutionFunc !== 'function') {
        throw new Error('Please define a function named "solution" or "main". Example: function solution(nums) { return nums; }');
      }
      
      // Execute test cases
      testCases.forEach((testCase, idx) => {
        try {
          // Parse input
          let input = testCase.input.trim();
          
          // Try to parse as JSON (arrays, objects, numbers, strings)
          let parsedInput = input;
          try {
            parsedInput = JSON.parse(input);
          } catch {
            // If not valid JSON, try to handle special cases
            // For arrays like "[1,2,3]" without quotes
            if (input.startsWith('[') && input.endsWith(']')) {
              try {
                parsedInput = JSON.parse(input);
              } catch {
                // Keep as string
              }
            }
          }
          
          // Call the solution function
          const actualOutput = solutionFunc(parsedInput);
          
          // Convert output to string for comparison
          let actualOutputStr;
          if (actualOutput === null || actualOutput === undefined) {
            actualOutputStr = String(actualOutput);
          } else if (typeof actualOutput === 'object') {
            actualOutputStr = JSON.stringify(actualOutput);
          } else {
            actualOutputStr = String(actualOutput);
          }
          
          const expectedOutput = String(testCase.expectedOutput).trim();
          
          // Normalize outputs for comparison (remove extra whitespace)
          const normalizedActual = actualOutputStr.trim().replace(/\s+/g, ' ');
          const normalizedExpected = expectedOutput.replace(/\s+/g, ' ');
          
          const passed = normalizedActual === normalizedExpected;
          
          results.push({
            input: testCase.input,
            expectedOutput: expectedOutput,
            actualOutput: actualOutputStr,
            passed,
            testCaseNumber: idx + 1
          });
          
        } catch (error) {
          results.push({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: `Error: ${error.message}`,
            passed: false,
            testCaseNumber: idx + 1
          });
        }
      });
      
    } catch (error) {
      // Error in code definition or execution
      testCases.forEach((testCase, idx) => {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: `Error: ${error.message}`,
          passed: false,
          testCaseNumber: idx + 1
        });
      });
    }
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    output += `Results: ${passedCount}/${totalCount} test cases passed.\n\n`;
    
    results.forEach((result) => {
      output += `Test Case ${result.testCaseNumber}: ${result.passed ? '✓ PASSED' : '✗ FAILED'}\n`;
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
  };

  const executeBackend = async (code, language, testCases) => {
    try {
      const response = await fetch(`${endpoints.questions}/api/questions/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: language,
          testCases
        })
      });
      
      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Execution failed');
      }
    } catch (error) {
      return {
        results: testCases.map((tc, idx) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: `Error: ${error.message}`,
          passed: false,
          testCaseNumber: idx + 1
        })),
        output: `Error executing code: ${error.message}`
      };
    }
  };

  const runCode = async () => {
    setOutput("Running your code...\n");
    setTestResults([]);

    if (!question || !question.testCases || question.testCases.length === 0) {
      setOutput("No test cases available for this question.");
      return;
    }

    try {
      let executionResult;
      
      if (language === 'javascript' || language === 'typescript') {
        // Execute JavaScript directly in browser (faster, no network call)
        executionResult = executeJavaScript(code, question.testCases);
      } else {
        // For other languages (Python, Java, C++, etc.), send to backend
        executionResult = await executeBackend(code, language, question.testCases);
      }
      
      setTestResults(executionResult.results);
      setOutput(executionResult.output);
      
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setTestResults([]);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(`${endpoints.chatbot}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          mode: 'coding',
          context: {
            questionId: questionId,
            question: question?.title,
            code: code,
            language: language
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: result.data.response 
        }]);
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.' 
        }]);
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Unable to connect to the chatbot service. Please try again later.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const handleMouseDown = (type) => {
    setIsResizing(type);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      if (isResizing === 'question') {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= window.innerWidth - chatbotWidth - 300) {
          setQuestionWidth(newWidth);
        }
      } else if (isResizing === 'chatbot') {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 0 && newWidth >= 200 && questionWidth + 300 <= window.innerWidth - newWidth) {
          setChatbotWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, chatbotWidth, questionWidth]);

  // Update theme when changed
  useEffect(() => {
    if (typeof window.monaco !== 'undefined') {
      window.monaco.editor.setTheme(theme);
    }
  }, [theme]);

  // Handle Vim mode toggle and theme updates
  useEffect(() => {
    if (typeof window.editorInstance !== 'undefined' && typeof window.monaco !== 'undefined') {
      // Update Vim status bar theme based on current theme
      const statusBar = document.querySelector('.vim-status-bar');
      if (statusBar) {
        if (theme.includes('dark')) {
          statusBar.style.background = '#1e1e1e';
          statusBar.style.color = '#d4d4d4';
          statusBar.style.borderTop = '1px solid #3c3c3c';
          statusBar.style.borderLeft = '1px solid #3c3c3c';
        } else {
          statusBar.style.background = '#ffffff';
          statusBar.style.color = '#000000';
          statusBar.style.borderTop = '1px solid #e5e7eb';
          statusBar.style.borderLeft = '1px solid #e5e7eb';
        }
      }

      if (vimMode) {
        // Enable Vim mode using monaco-vim
        try {
          if (!statusBar) {
            const codePanel = document.querySelector('.code-area');
            const statusNode = document.createElement('div');
            statusNode.className = 'vim-status-bar';
            statusNode.textContent = '-- NORMAL --';
            
            // Apply theme-based styling
            if (theme.includes('dark')) {
              statusNode.style.background = '#1e1e1e';
              statusNode.style.color = '#d4d4d4';
              statusNode.style.borderTop = '1px solid #3c3c3c';
              statusNode.style.borderLeft = '1px solid #3c3c3c';
            } else {
              statusNode.style.background = '#ffffff';
              statusNode.style.color = '#000000';
              statusNode.style.borderTop = '1px solid #e5e7eb';
              statusNode.style.borderLeft = '1px solid #e5e7eb';
            }
            
            if (codePanel) {
              codePanel.appendChild(statusNode);
            }
            
            const vimModeInstance = initVimMode(window.editorInstance, statusNode);
            window.vimModeInstance = vimModeInstance;
            
            console.log("Vim mode enabled");
          }
        } catch (err) {
          console.log("Vim mode initialization error:", err);
        }
      } else {
        // Disable Vim mode
        if (window.vimModeInstance) {
          window.vimModeInstance.dispose();
          window.vimModeInstance = null;
          
          // Remove status bar if it exists
          const statusBar = document.querySelector('.vim-status-bar');
          if (statusBar) {
            statusBar.remove();
          }
        }
      }
    }
  }, [vimMode, theme]);

  if (loading) {
    return (
      <div className="code-editor-page">
        <div className="loading">Loading question...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="code-editor-page">
        <div className="error">Question not found</div>
      </div>
    );
  }

  return (
    <div className="code-editor-page">
      <div className="editor-header-bar">
        <button className="back-btn" onClick={() => navigate('/problems')}>
          ← Back to Problems
        </button>
      </div>
      <div className="editor-container">
        {/* Question Panel (Left) */}
        <div className="question-panel" style={{ width: `${questionWidth}px` }}>
          <div className="question-header">
            <h1>{question.title}</h1>
            <span className={`difficulty-badge difficulty-${question.difficulty.toLowerCase()}`}>
              {question.difficulty}
            </span>
          </div>

          <div className="question-content">
            <div className="section">
              <h3>Description</h3>
              <p>{question.description}</p>
            </div>

            {question.examples && question.examples.length > 0 && (
              <div className="section">
                <h3>Examples</h3>
                {question.examples.map((example, idx) => (
                  <div key={idx} className="example">
                    <div className="example-title">Example {idx + 1}</div>
                    <div className="example-box">
                      <div><strong>Input:</strong> {example.input}</div>
                      <div><strong>Output:</strong> {example.output}</div>
                      {example.explanation && <div><strong>Explanation:</strong> {example.explanation}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {question.constraints && question.constraints.length > 0 && (
              <div className="section">
                <h3>Constraints</h3>
                <ul>
                  {question.constraints.map((constraint, idx) => (
                    <li key={idx}>{constraint}</li>
                  ))}
                </ul>
              </div>
            )}

            {question.hints && question.hints.length > 0 && (
              <div className="section">
                <h3>Hints</h3>
                <ul>
                  {question.hints.map((hint, idx) => (
                    <li key={idx}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}

            {question.categories && (
              <div className="section">
                <h3>Topics</h3>
                <div className="tags">
                  {question.categories.map((cat, idx) => (
                    <span key={idx} className="tag">{cat}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div 
          className="resize-handle"
          onMouseDown={() => handleMouseDown('question')}
        />

        {/* Code Panel (Middle) */}
        <div className="code-panel">
          <div className="code-header">
            <div className="code-controls">
              <select 
                className="language-select" 
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
              <select 
                className="theme-select" 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="custom-dark">Dark</option>
                <option value="custom-light">Light</option>
              </select>
              <label className="vim-toggle">
                <input 
                  type="checkbox" 
                  checked={vimMode}
                  onChange={(e) => setVimMode(e.target.checked)}
                />
                <span>Vim</span>
              </label>
            </div>
            <button className="run-btn" onClick={runCode}>
              Run
            </button>
          </div>

          <div className="code-area">
            <Editor
              height="100%"
              language={language}
              theme={theme}
              value={code}
              onChange={(value) => setCode(value || "")}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                tabSize: 2,
              }}
            />
          </div>

          <div className="output-area">
            <div className="output-header">Output</div>
            <div className="output-content">
              <pre>{output || "Click 'Run' to execute your code..."}</pre>
            </div>
          </div>

          {testResults.length > 0 && (
            <div className="test-results">
              <div className="test-results-header">Test Cases</div>
              {testResults.map((result, idx) => (
                <div key={idx} className={`test-result ${result.passed ? 'passed' : 'failed'}`}>
                  <div className="test-result-header">
                    Test Case {result.testCaseNumber} 
                    <span className="test-status">
                      {result.passed ? '✓ Passed' : '✗ Failed'}
                    </span>
                  </div>
                  {!result.passed && (
                    <div className="test-details">
                      <div>Expected: {result.expectedOutput}</div>
                      <div>Got: {result.actualOutput}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div 
          className="resize-handle"
          onMouseDown={() => handleMouseDown('chatbot')}
        />

        {/* Chatbot Panel (Right) */}
        <div className="chatbot-panel" style={{ width: `${chatbotWidth}px` }}>
          <div className="chatbot-header">
            <h3>Preppy</h3>
          </div>
          <div className="chatbot-messages">
            {chatMessages.length === 0 ? (
              <div className="message assistant">
                Hi! I'm Preppy, your AI coding assistant! Ask me questions, request hints, or discuss your approach!
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  {msg.content}
                </div>
              ))
            )}
            {chatLoading && (
              <div className="message assistant">
                <em>AI is typing...</em>
              </div>
            )}
          </div>
          <div className="chatbot-input-area">
            <textarea
              className="chatbot-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleChatKeyPress}
              placeholder="Ask for help or hints..."
              disabled={chatLoading}
            />
            <button 
              className="chatbot-send-btn"
              onClick={sendChatMessage}
              disabled={chatLoading || !chatInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

