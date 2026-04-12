/**
 * SQL Query Compiler — script.js
 * Pure JavaScript: tokenizer, mock parser, IR generator
 * and DOM rendering with syntax highlighting.
 */

// ─── DOM References ──────────────────────────────────────────────────────────
const sqlInput = document.getElementById('sqlInput');
const compileBtn = document.getElementById('compileBtn');
const errorMsg = document.getElementById('errorMsg');
const charCount = document.getElementById('charCount');
const loaderBar = document.getElementById('loaderBar');
const outputWrapper = document.getElementById('outputWrapper');
const tokenOutput = document.getElementById('tokenOutput');
const parseOutput = document.getElementById('parseOutput');
const irOutput = document.getElementById('irOutput');

// ─── SQL Keyword / Token Type Definitions ────────────────────────────────────
const KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'GROUP BY', 'ORDER BY',
  'HAVING', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'TABLE', 'DROP', 'AS', 'DISTINCT', 'LIMIT', 'AND', 'OR',
  'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'INNER', 'LEFT',
  'RIGHT', 'OUTER', 'CROSS', 'BY'];

const OPERATORS = ['=', '<>', '!=', '>', '<', '>=', '<=', '+', '-', '*', '/'];

const TYPE_MAP = {
  KEYWORD: 'tok-keyword', IDENTIFIER: 'tok-identifier',
  OPERATOR: 'tok-operator', LITERAL: 'tok-literal',
  PUNCTUATION: 'tok-punctuation',
};

// ─── Tokenizer ───────────────────────────────────────────────────────────────
/**
 * Lexes a SQL string into an array of token objects: { value, type }
 * This is a simplified lexer — covers most common SQL patterns.
 */
function tokenize(sql) {
  const tokens = [];
  // Regex groups: strings, numbers, identifiers/keywords, operators, punctuation
  const regex = /('(?:''|[^'])*'|"(?:""|[^"])*")|(\b\d+(?:\.\d+)?\b)|(GROUP\sBY|ORDER\sBY|\b[A-Za-z_][A-Za-z0-9_]*\b)|(<>|!=|>=|<=|=|<|>|\+|\-|\*|\/)|([(),;])/g;
  let match;

  while ((match = regex.exec(sql)) !== null) {
    const [, strLit, numLit, word, op, punct] = match;

    if (strLit || numLit) {
      tokens.push({ value: strLit || numLit, type: 'LITERAL' });
    } else if (word) {
      const upper = word.toUpperCase();
      tokens.push({ value: word, type: KEYWORDS.includes(upper) ? 'KEYWORD' : 'IDENTIFIER' });
    } else if (op) {
      tokens.push({ value: op, type: 'OPERATOR' });
    } else if (punct) {
      tokens.push({ value: punct, type: 'PUNCTUATION' });
    }
  }
  return tokens;
}

// ─── Mock Parser → Parse Tree ─────────────────────────────────────────────────
/**
 * Produces a simplified mock parse tree as a structured object.
 * In a real compiler this would be a recursive descent parser.
 */
function buildParseTree(tokens) {
  const tree = { node: 'SELECT_STATEMENT', children: [] };

  // Collect keywords and their associated identifiers
  let mode = null;
  const columns = [], tables = [], conditions = [];

  tokens.forEach((tok, i) => {
    const val = tok.value.toUpperCase();

    if (tok.type === 'KEYWORD') {
      if (val === 'SELECT') mode = 'cols';
      else if (val === 'FROM') mode = 'table';
      else if (val === 'WHERE') mode = 'cond';
      else if (val === 'JOIN') mode = 'table';
      else mode = null;
      return;
    }

    if (tok.type === 'IDENTIFIER') {
      if (mode === 'cols') columns.push(tok.value);
      else if (mode === 'table') tables.push(tok.value);
    }

    if (mode === 'cond' && tok.type !== 'KEYWORD') {
      conditions.push(tok.value);
    }
  });

  // Build child nodes
  if (columns.length) {
    tree.children.push({
      node: 'SELECT_LIST',
      children: columns.map(c => ({
        node: 'COLUMN',
        children: [
          { node: 'IDENTIFIER', value: c, children: [] }
        ]
      }))
    });
  }

  if (tables.length) {
    tree.children.push({
      node: 'FROM_CLAUSE',
      children: tables.map(t => ({
        node: 'TABLE_REF',
        children: [
          { node: 'IDENTIFIER', value: t, children: [] }
        ]
      }))
    });
  }

  if (conditions.length) {
    tree.children.push({
      node: 'WHERE_CLAUSE',
      children: [{
        node: 'CONDITION',
        children: conditions.map(c => ({
          node: 'TOKEN',
          value: c,
          children: []
        }))
      }]
    });
  }

  return tree;
}

// ─── Intermediate Code (Relational Algebra) ───────────────────────────────────
/**
 * Derives a simple relational algebra expression from the parse tree.
 */
function buildIR(parseTree) {
  let columns = [], tables = [], condition = null;

  parseTree.children.forEach(child => {
    if (child.node === 'SELECT_LIST')
      columns = child.children.map(c => c.children[0].value);
    if (child.node === 'FROM_CLAUSE')
      tables = child.children.map(t => t.children[0].value);
    if (child.node === 'WHERE_CLAUSE' && child.children.length)
      condition = child.children[0].children.map(t => t.value).join(' ');
  });

  const ir = [];

  // Build from the inside out: Table → Select (σ) → Project (π)
  const tableExprs = tables.map(t => ({ fn: 'Scan', args: [t] }));

  let base;
  if (tableExprs.length === 1) {
    base = tableExprs[0];
  } else {
    // Multiple tables → natural join
    base = tableExprs.slice(1).reduce(
      (acc, t) => ({ fn: 'NJoin', args: [acc, t] }),
      tableExprs[0]
    );
  }

  if (condition) {
    base = { fn: 'Select\u03C3', args: [condition], child: base };
  }

  const colStr = columns.length ? columns.join(', ') : '*';
  base = { fn: 'Project\u03C0', args: [colStr], child: base };

  return base; // Returns nested IR node
}

// ─── Renderers ────────────────────────────────────────────────────────────────

/** Renders the token stream as highlighted HTML lines */
function renderTokens(tokens) {
  if (!tokens.length) return '<span class="tok-operator">// no tokens found</span>';

  return tokens.map(tok => {
    const cls = TYPE_MAP[tok.type] || 'tok-leaf';
    return `<span class="${cls}">${escHtml(tok.value)}</span><span class="tok-arrow"> → </span><span class="tok-operator">${tok.type}</span>`;
  }).join('\n');
}

/** Recursively renders a parse tree node as structured HTML (Top-Down Tree) */
function renderParseTree(node) {
  if (!node) return '';

  let html = `<li>
    <div class="tree-node">
      <span class="node-type">${escHtml(node.node)}</span>`;

  if (node.value) {
    html += `<span class="node-val">${escHtml(node.value)}</span>`;
  }

  html += `</div>`;

  if (node.children && node.children.length) {
    html += `<ul>`;
    node.children.forEach(child => {
      html += renderParseTree(child);
    });
    html += `</ul>`;
  }

  html += `</li>`;
  return html;
}

/** Recursively renders the IR node tree as indented HTML */
function renderIR(node, depth = 0) {
  if (!node) return '';
  const indent = '    '.repeat(depth);
  const branch = depth > 0 ? '└── ' : '';
  const argsStr = node.args.map(a => typeof a === 'string' ? a : '…').join(', ');

  let html = `${escHtml(indent + branch)}<span class="ir-func">${escHtml(node.fn)}</span>(<span class="ir-arg">${escHtml(argsStr)}</span>)\n`;

  if (node.child) {
    html += renderIR(node.child, depth + 1);
  }
  if (node.args) {
    node.args.forEach(arg => {
      if (typeof arg === 'object' && arg.fn) {
        html += renderIR(arg, depth + 1);
      }
    });
  }

  return html;
}

/** Escapes HTML special characters */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── UI Utilities ─────────────────────────────────────────────────────────────

/** Shows an error message beneath the textarea */
function showError(msg) {
  errorMsg.textContent = '⚠ ' + msg;
  errorMsg.classList.add('visible');
  sqlInput.style.borderColor = 'var(--accent-red)';
}

/** Clears the error state */
function clearError() {
  errorMsg.textContent = '';
  errorMsg.classList.remove('visible');
  sqlInput.style.borderColor = '';
}

/** Clears all output panels */
function clearOutputs() {
  tokenOutput.innerHTML = '';
  parseOutput.innerHTML = '';
  irOutput.innerHTML = '';
  outputWrapper.classList.remove('visible');
}

/** Shows the loader bar and disables the button */
function setLoading(state) {
  if (state) {
    loaderBar.classList.add('active');
    compileBtn.classList.add('loading');
    compileBtn.querySelector('.btn-text').textContent = 'Compiling…';
  } else {
    loaderBar.classList.remove('active');
    compileBtn.classList.remove('loading');
    compileBtn.querySelector('.btn-text').textContent = 'Compile';
  }
}

// ─── Core Compile Handler ─────────────────────────────────────────────────────

/**
 * Main handler: sends the query to the C++ backend via our Node server,
 * then renders the returned JSON architecture.
 */
async function handleCompile() {
  const query = sqlInput.value.trim();
  if (!query) {
    showError('Please enter a SQL query before compiling.');
    return;
  }

  // Pre-validation (optional, but keeps UI snappy)
  try {
    const localTokens = tokenize(query);
    validateQuery(localTokens);
  } catch (err) {
    showError(err.message);
    return;
  }

  clearError();
  clearOutputs();
  setLoading(true);

  try {
    const response = await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server error during compilation');
    }

    // Render outputs from backend
    tokenOutput.innerHTML = renderTokens(data.tokens);
    parseOutput.innerHTML = `<div class="tree-container"><ul>${renderParseTree(data.parseTree)}</ul></div>`;

    // IR from backend is now a structured tree
    irOutput.innerHTML = `<div class="tree-container ir-tree-container"><ul>${renderParseTree(data.irTree)}</ul></div>`;

    // Reveal output sections
    outputWrapper.classList.add('visible');

  } catch (err) {
    showError('Compilation failed: ' + err.message);
    console.error(err);
  } finally {
    setLoading(false);
  }
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

// Compile on button click
compileBtn.addEventListener('click', handleCompile);

// Compile on Ctrl+Enter / Cmd+Enter
sqlInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleCompile();
  }
});

// Live character counter + clear error on input
sqlInput.addEventListener('input', () => {
  const len = sqlInput.value.length;
  charCount.textContent = len + (len === 1 ? ' character' : ' characters');
  if (len > 0) clearError();
});

function validateQuery(tokens) {
  const hasSelect = tokens.some(t => t.value.toUpperCase() === 'SELECT');
  const hasFrom = tokens.some(t => t.value.toUpperCase() === 'FROM');

  if (!hasSelect || !hasFrom) {
    throw new Error("Invalid SQL: Missing SELECT or FROM clause");
  }
}
