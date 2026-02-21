#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(path.join(process.cwd(), '.env'));

function printUsage() {
  console.log(`Usage:
  node .\\render-post.js <markdownFile> [--output <file.html>] [--open]

Arguments:
  <markdownFile>        Path to markdown file to render

Options:
  --output <file.html>  Output HTML file path (default: same name with .html)
  --open                Open in default browser after rendering
  --help                Show this message
`);
}

function getOptionValue(args, name) {
  const withEquals = args.find((arg) => arg.startsWith(`${name}=`));
  if (withEquals) {
    return withEquals.slice(name.length + 1);
  }

  const index = args.indexOf(name);
  if (index !== -1 && args[index + 1] && !args[index + 1].startsWith('--')) {
    return args[index + 1];
  }

  return '';
}

function parseBooleanFlag(args, name) {
  return args.includes(name);
}

function parseFrontmatter(markdown) {
  const text = String(markdown || '');
  if (!text.startsWith('---')) {
    return { frontmatter: {}, body: text };
  }

  const lines = text.split(/\r?\n/);
  if (lines.length < 3 || lines[0].trim() !== '---') {
    return { frontmatter: {}, body: text };
  }

  let endIndex = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      endIndex = index;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: {}, body: text };
  }

  const frontmatterLines = lines.slice(1, endIndex);
  const bodyLines = lines.slice(endIndex + 1);
  const frontmatter = {};

  let currentListKey = '';
  for (const rawLine of frontmatterLines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('- ') && currentListKey) {
      frontmatter[currentListKey] = frontmatter[currentListKey] || [];
      frontmatter[currentListKey].push(line.slice(2).trim().replace(/^"|"$/g, ''));
      continue;
    }

    const separator = line.indexOf(':');
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (!value) {
      currentListKey = key;
      frontmatter[key] = [];
      continue;
    }

    currentListKey = '';
    value = value.replace(/^"|"$/g, '');
    frontmatter[key] = value;
  }

  return {
    frontmatter,
    body: bodyLines.join('\n'),
  };
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (char) => map[char]);
}

function parseMarkdown(markdown) {
  let html = String(markdown || '');

  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeBlocks = [];

  html = html.replace(codeBlockRegex, (match, lang, content) => {
    codeBlocks.push({ lang: lang || 'text', content });
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Mermaid diagrams
  html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    const block = codeBlocks[index];
    if (block.lang === 'mermaid') {
      return `<div class="mermaid-container"><pre class="mermaid">${escapeHtml(block.content.trim())}</pre></div>`;
    }
    if (block.lang === 'quiz') {
      return `__QUIZ_BLOCK_${index}__`;
    }
    return `<pre><code class="language-${escapeHtml(block.lang)}">${escapeHtml(block.content)}</code></pre>`;
  });

  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Blockquotes
  html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');

  // Lists
  html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(\d+)\. (.*?)$/gm, '<li>$2</li>');

  // Wrap consecutive list items
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
    return '<ul>\n' + match + '</ul>\n';
  });

  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Math (KaTeX)
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="math">$$\\displaystyle $1$$</div>');
  html = html.replace(/\$([^\$]+?)\$/g, '<span class="math">$$\\inline $1$$</span>');

  // Tables
  html = html.replace(/\| (.*?) \|\n\| (.*?) \|\n((?:\| .*? \|\n?)*)/g, (match) => {
    const lines = match.split('\n').filter((l) => l.trim());
    const table = '<table>\n<thead>\n<tr>' + lines[0].split('|').map((cell) => '<th>' + cell.trim() + '</th>').join('') + '</tr>\n</thead>\n<tbody>\n';
    return lines.slice(2).reduce((acc, line) => acc + '<tr>' + line.split('|').map((cell) => '<td>' + cell.trim() + '</td>').join('') + '</tr>\n', table) + '</tbody>\n</table>';
  });

  // Clean up
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h\d|<ul|<ol|<table|<blockquote)/g, '$1');
  html = html.replace(/(<\/h\d>|<\/ul>|<\/ol>|<\/table>|<\/blockquote>)<\/p>/g, '$1');

  return { html, codeBlocks };
}

function parseQuizBlock(content) {
  const lines = content.trim().split('\n');
  const questions = [];
  let currentQuestion = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.match(/^\d+\.\s+/)) {
      if (currentQuestion && currentQuestion.text) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        text: trimmed.replace(/^\d+\.\s+/, ''),
        type: 'multiple-choice',
        options: [],
        correctAnswer: null,
      };
    } else if (trimmed.match(/^[A-Z]\)\s+/)) {
      if (currentQuestion) {
        const option = {
          label: trimmed[0],
          text: trimmed.replace(/^[A-Z]\)\s+/, ''),
          correct: false,
        };
        currentQuestion.options.push(option);
      }
    } else if (trimmed.match(/^\s*\*\*\(Correct|^\s*\*Answer[s]?:/)) {
      const match = trimmed.match(/\(([A-Z])\)|Answer[s]?:\s*([A-Z])/);
      if (match && currentQuestion) {
        currentQuestion.correctAnswer = match[1] || match[2];
        const correctOption = currentQuestion.options.find((opt) => opt.label === currentQuestion.correctAnswer);
        if (correctOption) {
          correctOption.correct = true;
        }
      }
    }
  }

  if (currentQuestion && currentQuestion.text) {
    questions.push(currentQuestion);
  }

  return questions;
}

function renderQuiz(content, quizIndex) {
  const questions = parseQuizBlock(content);
  let html = `<div class="quiz-container" id="quiz-${quizIndex}"><h3>Quiz</h3>`;

  questions.forEach((q, idx) => {
    const questionId = `quiz-${quizIndex}-q-${idx}`;
    html += `<div class="quiz-question"><p><strong>Question ${idx + 1}:</strong> ${escapeHtml(q.text)}</p>`;

    q.options.forEach((opt) => {
      const optId = `${questionId}-${opt.label}`;
      html += `
        <label class="quiz-option">
          <input type="radio" name="${questionId}" value="${opt.label}" data-correct="${opt.correct}">
          <span>${opt.label})</span> ${escapeHtml(opt.text)}
        </label>
      `;
    });

    html += `<button onclick="checkAnswer('${questionId}')">Check Answer</button>`;
    html += `<div id="${questionId}-feedback" class="quiz-feedback"></div>`;
    html += '</div>';
  });

  html += '</div>';
  return html;
}

function buildHtmlTemplate(title, author, date, tags, contentHtml) {
  const tagsHtml = Array.isArray(tags) ? tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('\n') : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
  <style>
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .header {
      margin-bottom: 30px;
      border-bottom: 2px solid #eee;
      padding-bottom: 20px;
    }
    
    h1 {
      margin: 0 0 10px 0;
      font-size: 2.5em;
      color: #222;
    }
    
    h2 {
      margin: 30px 0 15px 0;
      font-size: 1.8em;
      color: #333;
      border-left: 4px solid #007bff;
      padding-left: 15px;
    }
    
    h3 {
      margin: 20px 0 10px 0;
      font-size: 1.3em;
      color: #555;
    }
    
    .meta {
      display: flex;
      gap: 20px;
      font-size: 0.9em;
      color: #666;
      margin-top: 10px;
    }
    
    .tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    
    .tag {
      background: #e8f4f8;
      color: #007bff;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 500;
    }
    
    p {
      margin: 15px 0;
      text-align: justify;
    }
    
    a {
      color: #007bff;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #d63384;
    }
    
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 15px 0;
    }
    
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    
    blockquote {
      border-left: 4px solid #ddd;
      margin: 15px 0;
      padding-left: 15px;
      font-style: italic;
      color: #666;
    }
    
    ul, ol {
      margin: 15px 0;
      padding-left: 30px;
    }
    
    li {
      margin: 8px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    
    th {
      background: #f5f5f5;
      font-weight: bold;
    }
    
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .mermaid-container {
      display: flex;
      justify-content: center;
      margin: 30px 0;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 5px;
      overflow-x: auto;
    }
    
    .mermaid {
      display: flex;
      justify-content: center;
    }
    
    .math {
      display: block;
      margin: 15px 0;
      overflow-x: auto;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    
    .quiz-container {
      background: #e8f4f8;
      border: 2px solid #007bff;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    
    .quiz-container h3 {
      margin-top: 0;
      color: #007bff;
    }
    
    .quiz-question {
      margin: 20px 0;
      padding: 15px;
      background: white;
      border-radius: 5px;
    }
    
    .quiz-option {
      display: flex;
      align-items: center;
      margin: 10px 0;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }
    
    .quiz-option:hover {
      background: #f0f0f0;
    }
    
    .quiz-option input {
      margin-right: 10px;
      cursor: pointer;
    }
    
    .quiz-feedback {
      margin-top: 10px;
      padding: 10px;
      border-radius: 4px;
      display: none;
      font-weight: 500;
    }
    
    .quiz-feedback.show {
      display: block;
    }
    
    .quiz-feedback.correct {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .quiz-feedback.incorrect {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1em;
      transition: background 0.2s;
    }
    
    button:hover {
      background: #0056b3;
    }
    
    button:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">
        <span><strong>Author:</strong> ${escapeHtml(author || 'Unknown')}</span>
        <span><strong>Published:</strong> ${date || 'N/A'}</span>
      </div>
      ${tagsHtml ? '<div class="tags">' + tagsHtml + '</div>' : ''}
    </div>
    
    <div class="content">
      ${contentHtml}
    </div>
  </div>
  
  <script>
    // Initialize Mermaid
    mermaid.contentLoaded();
    
    // Initialize KaTeX for math rendering
    document.querySelectorAll('.math').forEach(el => {
      try {
        if (el.textContent.includes('\\\\displaystyle') || el.textContent.includes('\\\\inline')) {
          const tex = el.textContent.replace(/^\\\\displaystyle\\s*/, '').replace(/^\\\\inline\\s*/, '');
          el.innerHTML = '';
          katex.render(tex, el, { displayMode: el.classList.contains('displaystyle') !== undefined });
        }
      } catch (e) {
        console.warn('KaTeX render error:', e);
      }
    });
    
    // Quiz functionality
    function checkAnswer(questionId) {
      const selected = document.querySelector(\`input[name="\${questionId}"]:checked\`);
      const feedback = document.getElementById(\`\${questionId}-feedback\`);
      
      if (!selected) {
        feedback.textContent = 'Please select an answer.';
        feedback.className = 'quiz-feedback show incorrect';
        return;
      }
      
      const isCorrect = selected.dataset.correct === 'true';
      feedback.textContent = isCorrect ? '✓ Correct!' : '✗ Incorrect. Try again!';
      feedback.className = 'quiz-feedback show ' + (isCorrect ? 'correct' : 'incorrect');
    }
  </script>
</body>
</html>`;
}

async function run() {
  const args = process.argv.slice(2);
  if (!args.length || parseBooleanFlag(args, '--help')) {
    printUsage();
    return;
  }

  const markdownFile = args.find((arg) => !arg.startsWith('--'));
  if (!markdownFile) {
    throw new Error('Missing markdown file path.');
  }

  const absolutePath = path.resolve(process.cwd(), markdownFile);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const rawMarkdown = fs.readFileSync(absolutePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(rawMarkdown);

  const { html, codeBlocks } = parseMarkdown(body);

  // Render quiz blocks
  let finalHtml = html;
  let quizIndex = 0;
  finalHtml = finalHtml.replace(/__QUIZ_BLOCK_(\d+)__/g, (match, blockIdx) => {
    const block = codeBlocks[blockIdx];
    return renderQuiz(block.content, quizIndex++);
  });

  const title = frontmatter.title || 'Untitled';
  const author = frontmatter.author || 'Unknown';
  const date = frontmatter.date || frontmatter.updated || '';
  const tags = frontmatter.tags || [];

  const htmlContent = buildHtmlTemplate(title, author, date, tags, finalHtml);

  // Determine output path
  let outputPath = getOptionValue(args, '--output');
  if (!outputPath) {
    outputPath = absolutePath.replace(/\.md$/, '.html');
  }

  fs.writeFileSync(outputPath, htmlContent, 'utf8');
  console.log(`✓ Rendered: ${title}`);
  console.log(`✓ Output: ${outputPath}`);

  if (parseBooleanFlag(args, '--open')) {
    const open = require('open');
    open(outputPath).catch(() => {
      console.log(`Open the file manually: ${outputPath}`);
    });
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
