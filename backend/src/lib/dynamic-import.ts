export async function esmImport(specifier: string): Promise<any> {
  return import(specifier);
}
