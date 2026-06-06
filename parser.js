// =====================
// STATE
// =====================
let tokens = [];
let pos = 0;
let errors = [];

// =====================
// UTIL
// =====================
function esc(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// =====================
// RESET
// =====================
function reset() {
    tokens = [];
    pos = 0;
    errors = [];

    document.getElementById("tokenOutput").innerHTML = "";
    document.getElementById("result").innerHTML = "";
    document.getElementById("status").innerHTML = "";
}

// =====================
// SCANNER (unchanged)
// =====================
function scanner(code) {

    const regex =
        /==|!=|<=|>=|\bpublic\b|\bprivate\b|\bstatic\b|\bint\b|\bvoid\b|\breturn\b|\bif\b|\belse\b|\b\d+\b|\b[a-zA-Z_][a-zA-Z0-9_]*\b|\+|\-|\*|\/|=|<|>|\{|\}|\(|\)|;|,/g;

    const matches = code.match(regex) || [];
    const out = [];

    let cursor = 0;

    for (const t of matches) {

        const idx = code.indexOf(t, cursor);
        const before = code.slice(0, idx);

        const line = (before.match(/\n/g) || []).length + 1;

        cursor = idx + t.length;

        let type = "UNKNOWN";

        if (["public","private","static","int","void","return","if","else"].includes(t))
            type = "KEYWORD";
        else if (/^\d+$/.test(t))
            type = "NUMBER";
        else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t))
            type = "IDENTIFIER";
        else
            type = "SYMBOL";

        out.push({ type, value: t, line });
    }

    return out;
}

// =====================
// HELPERS
// =====================
function peek(v) {
    return tokens[pos]?.value === v;
}

function consume(v) {
    if (peek(v)) {
        pos++;
        return true;
    }
    return false;
}

function isId() {
    return tokens[pos]?.type === "IDENTIFIER";
}

function isNum() {
    return tokens[pos]?.type === "NUMBER";
}

// =====================
// ERROR HANDLING
// =====================
function addError(msg, token) {
    errors.push({
        message: msg,
        value: token?.value || "EOF",
        line: token?.line || "?"
    });
}

// =====================
// SYNC (IMPORTANT FIX)
// skips broken tokens until safe point
// =====================
function sync() {
    while (
        pos < tokens.length &&
        tokens[pos].value !== ";" &&
        tokens[pos].value !== "}"
    ) {
        pos++;
    }

    if (tokens[pos]?.value === ";") pos++;
}

// =====================
// EXPRESSIONS (unchanged)
// =====================
function parseExpression() {
    if (!parseTerm()) return false;

    while (peek("+") || peek("-")) {
        pos++;
        if (!parseTerm()) return false;
    }

    return true;
}

function parseTerm() {
    if (!parseFactor()) return false;

    while (peek("*") || peek("/")) {
        pos++;
        if (!parseFactor()) return false;
    }

    return true;
}

function parseFactor() {

    if (isId() || isNum()) {
        pos++;
        return true;
    }

    if (consume("(")) {
        if (parseExpression() && consume(")")) return true;
    }

    return false;
}

// =====================
// STATEMENT (ERROR RECOVERY ADDED)
// =====================
function parseStatement() {

    let start = pos;

    if (isId()) {
        pos++;

        if (consume("=")) {

            if (!parseExpression()) {
                addError("Invalid expression", tokens[pos]);
                sync();
                return false;
            }

            if (!consume(";")) {
                addError("Missing semicolon", tokens[pos]);
                sync();
                return false;
            }

            return true;
        }
    }

    pos = start;
    return false;
}

// =====================
// DECLARATION (FIXED + RECOVERY)
// =====================
function parseDeclaration() {

    let start = pos;

    if (consume("int") || consume("void")) {

        if (isId()) {
            pos++;

            if (consume("=")) {
                if (!parseExpression()) {
                    addError("Invalid initialization", tokens[pos]);
                    sync();
                    return false;
                }
            }

            if (!consume(";")) {
                addError("Missing semicolon in declaration", tokens[pos]);
                sync();
                return false;
            }

            return true;
        }
    }

    pos = start;
    return false;
}

// =====================
// PROGRAM (NOW CONTINUES AFTER ERRORS)
// =====================
function parseProgram() {

    while (pos < tokens.length) {

        const start = pos;

        if (
            parseDeclaration() ||
            parseStatement()
        ) {
            continue;
        }

        // unknown token → error recovery
        addError("Unexpected token", tokens[pos]);
        sync();

        if (pos === start) pos++; // safety
    }

    return errors.length === 0;
}

// =====================
// RUNNER
// =====================
function runCompiler(code) {

    reset();

    tokens = scanner(code);

    document.getElementById("tokenOutput").innerHTML =
        tokens.map(t =>
            `<div><b>${t.type}</b>: ${esc(t.value)} (line ${t.line})</div>`
        ).join("");

    const ok = parseProgram();

    const result = document.getElementById("result");
    const status = document.getElementById("status");

    if (ok) {
        result.innerHTML = `<div style="color:green;">Syntax Correct</div>`;
        status.innerHTML = "OK";
        return;
    }

    result.innerHTML =
        errors.map(e =>
            `<div style="color:red;">
                ${esc(e.message)} → <b>${esc(e.value)}</b> (line ${e.line})
            </div>`
        ).join("");

    status.innerHTML = `ERRORS: ${errors.length}`;
}

// =====================
// UI
// =====================
function analyzeCode() {
    runCompiler(document.getElementById("codeInput").value);
}

document.getElementById("fileInput").addEventListener("change", async (e) => {

    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    document.getElementById("codeInput").value = text;

    runCompiler(text);
});

function clearAll() {
    document.getElementById("codeInput").value = "";
    reset();
}