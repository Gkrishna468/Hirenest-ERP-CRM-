export interface ExtensionManifest {
  name: string;
  version: string;
  capabilities: string[];
  permissions: string[];
}

export class ExtensionRegistry {
  private extensions: Map<string, ExtensionManifest> = new Map();

  registerExtension(extension: ExtensionManifest) {
    this.extensions.set(extension.name, extension);
    console.log(`[ExtensionRegistry] Registered extension: ${extension.name} (v${extension.version})`);
  }

  getExtension(name: string): ExtensionManifest | undefined {
    return this.extensions.get(name);
  }

  getAllExtensions(): ExtensionManifest[] {
    return Array.from(this.extensions.values());
  }

  findExtensionsByCapability(capability: string): ExtensionManifest[] {
    return this.getAllExtensions().filter(ext => ext.capabilities.includes(capability));
  }
}

export const extensionRegistry = new ExtensionRegistry();
