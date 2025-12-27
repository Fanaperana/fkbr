import { useState, useEffect } from "react";
import { load, Store } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";

export interface ShortcutConfig {
  modifiers: string[];
  key: string;
}

export const DEFAULT_SHORTCUT: ShortcutConfig = {
  modifiers: ["Control", "Alt"],
  key: "I",
};

const STORE_KEY = "shortcut_config";

/**
 * SettingsManager handles loading and saving user settings.
 */
export class SettingsManager {
  private static store: Store | null = null;

  static async getStore(): Promise<Store> {
    if (!this.store) {
      this.store = await load("settings.json", { autoSave: true });
    }
    return this.store;
  }

  static async getShortcut(): Promise<ShortcutConfig> {
    try {
      const store = await this.getStore();
      const saved = await store.get<ShortcutConfig>(STORE_KEY);
      return saved || DEFAULT_SHORTCUT;
    } catch {
      return DEFAULT_SHORTCUT;
    }
  }

  static async setShortcut(config: ShortcutConfig): Promise<void> {
    const store = await this.getStore();
    await store.set(STORE_KEY, config);
    await store.save();
    
    // Notify Rust to update the shortcut
    await invoke("update_shortcut", {
      modifiers: config.modifiers,
      key: config.key,
    });
  }

  static formatShortcut(config: ShortcutConfig): string {
    const mods = config.modifiers.map(m => {
      switch (m) {
        case "Control": return "Ctrl";
        case "Alt": return "Alt";
        case "Shift": return "Shift";
        case "Super": return "Win";
        default: return m;
      }
    });
    return [...mods, config.key].join("+");
  }
}

/**
 * Available modifier keys.
 */
export const MODIFIER_OPTIONS = ["Control", "Alt", "Shift", "Super"];

/**
 * Available key options (letters and function keys).
 */
export const KEY_OPTIONS = [
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
  ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`), // F1-F12
];

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Settings dialog component for customizing the shortcut.
 */
export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [modifiers, setModifiers] = useState<string[]>(DEFAULT_SHORTCUT.modifiers);
  const [key, setKey] = useState<string>(DEFAULT_SHORTCUT.key);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load current settings when dialog opens
      SettingsManager.getShortcut().then((config) => {
        setModifiers(config.modifiers);
        setKey(config.key);
      });
    }
  }, [isOpen]);

  const toggleModifier = (mod: string) => {
    setModifiers((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleSave = async () => {
    if (modifiers.length === 0) {
      setError("Please select at least one modifier key");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await SettingsManager.setShortcut({ modifiers, key });
      onClose();
    } catch (e) {
      setError(`Failed to save shortcut: ${e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setModifiers(DEFAULT_SHORTCUT.modifiers);
    setKey(DEFAULT_SHORTCUT.key);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div 
        className="bg-gray-900 border border-yellow-700 rounded-lg p-6 max-w-md w-full mx-4"
        style={{ boxShadow: "0 0 20px rgba(0,0,0,0.5)" }}
      >
        <h2 
          className="text-xl font-bold mb-4"
          style={{ color: "cornsilk" }}
        >
          ⚙️ Settings
        </h2>

        <div className="mb-4">
          <label 
            className="block text-sm mb-2"
            style={{ color: "cornsilk", opacity: 0.8 }}
          >
            Activation Shortcut
          </label>
          
          {/* Current shortcut preview */}
          <div 
            className="bg-black bg-opacity-50 border border-yellow-700 border-opacity-40 px-4 py-3 rounded-md mb-4 text-center"
          >
            <span 
              className="font-mono text-lg"
              style={{ color: "cornsilk" }}
            >
              {SettingsManager.formatShortcut({ modifiers, key })}
            </span>
          </div>

          {/* Modifier keys */}
          <div className="mb-3">
            <span 
              className="block text-xs mb-2"
              style={{ color: "cornsilk", opacity: 0.6 }}
            >
              Modifier Keys
            </span>
            <div className="flex flex-wrap gap-2">
              {MODIFIER_OPTIONS.map((mod) => (
                <button
                  key={mod}
                  onClick={() => toggleModifier(mod)}
                  className={`
                    px-3 py-1 rounded border text-sm transition-colors
                    ${modifiers.includes(mod)
                      ? "border-yellow-400 bg-yellow-400 bg-opacity-20 text-yellow-400"
                      : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }
                  `}
                >
                  {mod === "Control" ? "Ctrl" : mod === "Super" ? "Win" : mod}
                </button>
              ))}
            </div>
          </div>

          {/* Key selection */}
          <div>
            <span 
              className="block text-xs mb-2"
              style={{ color: "cornsilk", opacity: 0.6 }}
            >
              Key
            </span>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
            >
              {KEY_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded border border-gray-600 text-gray-400 hover:border-gray-500 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-600 text-gray-400 hover:border-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:bg-opacity-20 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
