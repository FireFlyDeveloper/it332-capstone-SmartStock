import { contextBridge } from 'electron';

type SmartStockDesktopConfig = Readonly<{
  apiBase: string;
  appVersion: string;
  isDesktop: true;
}>;

function readArgument(name: string): string | undefined {
  const prefix = `--${name}=`;
  const value = process.argv.find((argument) => argument.startsWith(prefix));

  if (!value) {
    return undefined;
  }

  return decodeURIComponent(value.slice(prefix.length));
}

const config: SmartStockDesktopConfig = Object.freeze({
  apiBase: readArgument('smartstock-api-base') ?? 'http://localhost:3000',
  appVersion: readArgument('smartstock-app-version') ?? '0.0.0',
  isDesktop: true,
});

contextBridge.exposeInMainWorld('smartStockDesktop', config);
