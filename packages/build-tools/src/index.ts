import {
  type CompilerOptions,
  createCompilerHost,
  createProgram,
  formatDiagnosticsWithColorAndContext,
} from "typescript";

export function createTypes(entrypoints: string[], outdir = "dist"): void {
  const config: CompilerOptions = {
    emitDeclarationOnly: true,
    declaration: true,
    declarationMap: true,
    declarationDir: outdir,
    skipLibCheck: true,
  };
  const result = createProgram(entrypoints, config).emit(
    undefined,
    undefined,
    undefined,
    true,
  );
  if (result.emitSkipped) {
    // eslint-disable-next-line no-console
    console.error(
      formatDiagnosticsWithColorAndContext(
        result.diagnostics,
        createCompilerHost(config),
      ),
    );
    process.exitCode = 1;
  }
}
