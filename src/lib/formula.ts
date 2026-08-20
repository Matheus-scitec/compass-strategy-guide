// Parser seguro de fórmulas de indicador.
// Não usa eval. Tokeniza e monta uma AST por descida recursiva.
// Suporta números, parênteses, operadores + - * / × ÷ e variáveis nomeadas
// (letras, _, ., dígitos). Permite apuração calculada a partir de variáveis.

type Token =
  | { tipo: "num"; valor: number }
  | { tipo: "var"; nome: string }
  | { tipo: "op"; valor: "+" | "-" | "*" | "/" }
  | { tipo: "paren"; valor: "(" | ")" };

const OPS = new Set(["+", "-", "*", "/", "×", "÷"]);

function tokenizar(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = expr.replace(/,/g, "."); // vírgula decimal vira ponto
  while (i < s.length) {
    const ch = s[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i += 1;
      continue;
    }
    if (ch === "(" || ch === ")") {
      tokens.push({ tipo: "paren", valor: ch });
      i += 1;
      continue;
    }
    if (ch === "×") {
      tokens.push({ tipo: "op", valor: "*" });
      i += 1;
      continue;
    }
    if (ch === "÷") {
      tokens.push({ tipo: "op", valor: "/" });
      i += 1;
      continue;
    }
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      tokens.push({ tipo: "op", valor: ch });
      i += 1;
      continue;
    }
    // número: dígitos com ponto decimal
    if (/[0-9.]/.test(ch)) {
      let j = i;
      let temPonto = false;
      while (j < s.length && /[0-9.]/.test(s[j])) {
        if (s[j] === ".") {
          if (temPonto) break;
          temPonto = true;
        }
        j += 1;
      }
      const numStr = s.slice(i, j);
      const num = Number(numStr);
      if (Number.isNaN(num)) {
        throw new Error(`Número inválido: "${numStr}"`);
      }
      tokens.push({ tipo: "num", valor: num });
      i = j;
      continue;
    }
    // variável: letra/_ seguido de letras, _, ., dígitos
    if (/[A-Za-zÀ-ÿ_]/.test(ch)) {
      let j = i;
      while (j < s.length && /[A-Za-zÀ-ÿ0-9_.\-]/.test(s[j])) {
        j += 1;
      }
      const nome = s.slice(i, j).replace(/\.+$/, "");
      if (!nome) throw new Error("Nome de variável inválido.");
      tokens.push({ tipo: "var", nome });
      i = j;
      continue;
    }
    throw new Error(`Caractere não reconhecido: "${ch}"`);
  }
  return tokens;
}

// AST
type No =
  | { tipo: "num"; valor: number }
  | { tipo: "var"; nome: string }
  | { tipo: "neg"; operando: No }
  | { tipo: "bin"; op: "+" | "-" | "*" | "/"; esq: No; dir: No };

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private atual(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consumir(): Token {
    return this.tokens[this.pos++];
  }

  private esperaParen(valor: "(" | ")") {
    const t = this.consumir();
    if (!t || t.tipo !== "paren" || t.valor !== valor) {
      throw new Error(valor === "(" ? "Esperava '('" : "Esperava ')'");
    }
  }

  // expr := termo (('+'|'-') termo)*
  private expr(): No {
    let esq = this.termo();
    for (;;) {
      const t = this.atual();
      if (t && t.tipo === "op" && (t.valor === "+" || t.valor === "-")) {
        this.consumir();
        esq = { tipo: "bin", op: t.valor, esq, dir: this.termo() };
      } else {
        break;
      }
    }
    return esq;
  }

  // termo := fator (('*'|'/') fator)*
  private termo(): No {
    let esq = this.fator();
    for (;;) {
      const t = this.atual();
      if (t && t.tipo === "op" && (t.valor === "*" || t.valor === "/")) {
        this.consumir();
        esq = { tipo: "bin", op: t.valor, esq, dir: this.fator() };
      } else {
        break;
      }
    }
    return esq;
  }

  // fator := '-' fator | '(' expr ')' | número | variável
  private fator(): No {
    const t = this.atual();
    if (!t) throw new Error("Fórmula incompleta.");
    if (t.tipo === "op" && t.valor === "-") {
      this.consumir();
      return { tipo: "neg", operando: this.fator() };
    }
    if (t.tipo === "op" && t.valor === "+") {
      this.consumir();
      return this.fator();
    }
    if (t.tipo === "paren" && t.valor === "(") {
      this.consumir();
      const interno = this.expr();
      this.esperaParen(")");
      return interno;
    }
    if (t.tipo === "num") {
      this.consumir();
      return { tipo: "num", valor: t.valor };
    }
    if (t.tipo === "var") {
      this.consumir();
      return { tipo: "var", nome: t.nome };
    }
    throw new Error(`Token inesperado: "${"valor" in t ? t.valor : t.nome}"`);
  }

  parse(): No {
    const ast = this.expr();
    if (this.pos < this.tokens.length) {
      throw new Error("Sobrou conteúdo após o fim da fórmula.");
    }
    return ast;
  }
}

function avaliar(no: No, vars: Record<string, number>): number {
  switch (no.tipo) {
    case "num":
      return no.valor;
    case "var": {
      if (!(no.nome in vars)) {
        throw new Error(`Variável não informada: ${no.nome}`);
      }
      const v = vars[no.nome];
      if (v === null || v === undefined || Number.isNaN(v)) {
        throw new Error(`Variável sem valor: ${no.nome}`);
      }
      return v;
    }
    case "neg":
      return -avaliar(no.operando, vars);
    case "bin": {
      const e = avaliar(no.esq, vars);
      const d = avaliar(no.dir, vars);
      if (no.op === "+") return e + d;
      if (no.op === "-") return e - d;
      if (no.op === "*") return e * d;
      if (no.op === "/") {
        if (d === 0) throw new Error("Divisão por zero.");
        return e / d;
      }
      throw new Error("Operador inválido.");
    }
  }
}

export type ResultadoFormula = {
  ok: boolean;
  erro?: string;
  variaveis: string[];
};

/** Valida a fórmula e devolve a lista de variáveis referenciadas. */
export function analisarFormula(expr: string | null | undefined): ResultadoFormula {
  const texto = (expr ?? "").trim();
  if (!texto) return { ok: false, erro: "Fórmula vazia.", variaveis: [] };
  try {
    const tokens = tokenizar(texto);
    if (!tokens.length) return { ok: false, erro: "Fórmula vazia.", variaveis: [] };
    const ast = new Parser(tokens).parse();
    const vars = new Set<string>();
    const coletar = (no: No) => {
      if (no.tipo === "var") vars.add(no.nome);
      else if (no.tipo === "neg") coletar(no.operando);
      else if (no.tipo === "bin") {
        coletar(no.esq);
        coletar(no.dir);
      }
    };
    coletar(ast);
    return { ok: true, variaveis: [...vars] };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Fórmula inválida.", variaveis: [] };
  }
}

/** Calcula o valor da fórmula dado um mapa de variáveis. Lança em caso de erro. */
export function calcularFormula(expr: string, vars: Record<string, number>): number {
  const tokens = tokenizar(expr);
  const ast = new Parser(tokens).parse();
  return avaliar(ast, vars);
}

/** Verifica se a fórmula é passível de cálculo (válida e com variáveis). */
export function formulaCalculavel(expr: string | null | undefined): boolean {
  const r = analisarFormula(expr);
  return r.ok && r.variaveis.length > 0;
}
