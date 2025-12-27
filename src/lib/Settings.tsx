import { useState, useEffect } from "react";
import { load, Store } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";
import { GridConfig, DEFAULT_CONFIG, getValidCellCountOptions, getRecommendedCellCount, CoordinateMode, MAX_CELLS } from "./types";

export interface ShortcutConfig {
  modifiers: string[];
  key: string;
}

export const DEFAULT_SHORTCUT: ShortcutConfig = {
  modifiers: ["Control", "Alt"],
  key: "I",
};

const SHORTCUT_STORE_KEY = "shortcut_config";
const GRID_STORE_KEY = "grid_config";

/**
 * SettingsManager handles loading and saving user settings.
 */
export class SettingsManager {
  private static store: Store | null = null;

  static async getStore(): Promise<Store> {
    if (!this.store) {
      this.store = await load("settings.json");
    }
    return this.store;
  }

  static async getShortcut(): Promise<ShortcutConfig> {
    try {
      const store = await this.getStore();
      const saved = await store.get<ShortcutConfig>(SHORTCUT_STORE_KEY);
      return saved || DEFAULT_SHORTCUT;
    } catch {
      return DEFAULT_SHORTCUT;
    }
  }

  static async setShortcut(config: ShortcutConfig): Promise<void> {
    const store = await this.getStore();
    await store.set(SHORTCUT_STORE_KEY, config);
    await store.save();
    
    // Notify Rust to update the shortcut
    await invoke("update_shortcut", {
      modifiers: config.modifiers,
      key: config.key,
    });
  }

  static async getGridConfig(): Promise<GridConfig> {
    try {
      const store = await this.getStore();
      const saved = await store.get<GridConfig>(GRID_STORE_KEY);
      return saved || DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  static async setGridConfig(config: GridConfig): Promise<void> {
    const store = await this.getStore();
    await store.set(GRID_STORE_KEY, config);
    await store.save();
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
  onGridConfigChange?: (config: GridConfig) => void;
}

/**
 * Settings dialog component for customizing the shortcut and grid.
 */
export function SettingsDialog({ isOpen, onClose, onGridConfigChange }: SettingsDialogProps) {
  const [modifiers, setModifiers] = useState<string[]>(DEFAULT_SHORTCUT.modifiers);
  const [key, setKey] = useState<string>(DEFAULT_SHORTCUT.key);
  const [gridConfig, setGridConfig] = useState<GridConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"shortcut" | "grid">("shortcut");

  // Get screen dimensions for recommendations
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;

  useEffect(() => {
    if (isOpen) {
      // Load current settings when dialog opens
      SettingsManager.getShortcut().then((config) => {
        setModifiers(config.modifiers);
        setKey(config.key);
      });
      SettingsManager.getGridConfig().then((config) => {
        setGridConfig(config);
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
      await SettingsManager.setGridConfig(gridConfig);
      onGridConfigChange?.(gridConfig);
      onClose();
    } catch (e) {
      setError(`Failed to save settings: ${e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setModifiers(DEFAULT_SHORTCUT.modifiers);
    setKey(DEFAULT_SHORTCUT.key);
    setGridConfig(DEFAULT_CONFIG);
  };

  const handleAutoDetect = () => {
    const recommended = getRecommendedCellCount(screenWidth, screenHeight, gridConfig.coordinateMode);
    setGridConfig(prev => ({ ...prev, targetCellCount: recommended }));
  };

  const cellCountOptions = getValidCellCountOptions(gridConfig.coordinateMode);
  const totalPositions = gridConfig.targetCellCount * 9; // Each cell has 9 subcells

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div 
        className="bg-gray-900 border border-yellow-700 rounded-lg p-6 max-w-lg w-full mx-4"
        style={{ boxShadow: "0 0 20px rgba(0,0,0,0.5)" }}
      >
        <h2 
          className="text-xl font-bold mb-4"
          style={{ color: "cornsilk" }}
        >
          ⚙️ Settings
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-700 pb-2">
          <button
            onClick={() => setActiveTab("shortcut")}
            className={`px-4 py-2 rounded-t text-sm transition-colors ${
              activeTab === "shortcut"
                ? "bg-yellow-400 bg-opacity-20 text-yellow-400 border-b-2 border-yellow-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Shortcut
          </button>
          <button
            onClick={() => setActiveTab("grid")}
            className={`px-4 py-2 rounded-t text-sm transition-colors ${
              activeTab === "grid"
                ? "bg-yellow-400 bg-opacity-20 text-yellow-400 border-b-2 border-yellow-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Grid
          </button>
        </div>

        {/* Shortcut Tab */}
        {activeTab === "shortcut" && (
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
        )}

        {/* Grid Tab */}
        {activeTab === "grid" && (
          <div className="mb-4">
            {/* Screen info */}
            <div 
              className="bg-black bg-opacity-50 border border-yellow-700 border-opacity-40 px-4 py-3 rounded-md mb-4"
            >
              <div className="flex justify-between text-sm" style={{ color: "cornsilk" }}>
                <span>Screen Size:</span>
                <span className="font-mono">{screenWidth} × {screenHeight}</span>
              </div>
              <div className="flex justify-between text-sm mt-1" style={{ color: "cornsilk" }}>
                <span>Total Click Positions:</span>
                <span className="font-mono text-yellow-400">{totalPositions.toLocaleString()}</span>
              </div>
            </div>

            {/* Coordinate Mode */}
            <div className="mb-4">
              <span 
                className="block text-xs mb-2"
                style={{ color: "cornsilk", opacity: 0.6 }}
              >
                Coordinate Mode
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setGridConfig(prev => {
                    const newMode: CoordinateMode = "2-char";
                    return { 
                      ...prev, 
                      coordinateMode: newMode,
                      targetCellCount: Math.min(prev.targetCellCount, MAX_CELLS[newMode])
                    };
                  })}
                  className={`flex-1 px-3 py-2 rounded border text-sm transition-colors ${
                    gridConfig.coordinateMode === "2-char"
                      ? "border-yellow-400 bg-yellow-400 bg-opacity-20 text-yellow-400"
                      : "border-gray-600 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <div className="font-semibold">2-Char</div>
                  <div className="text-xs opacity-70">AA → 1296 cells</div>
                </button>
                <button
                  onClick={() => setGridConfig(prev => ({ 
                    ...prev, 
                    coordinateMode: "3-char" as CoordinateMode 
                  }))}
                  className={`flex-1 px-3 py-2 rounded border text-sm transition-colors ${
                    gridConfig.coordinateMode === "3-char"
                      ? "border-yellow-400 bg-yellow-400 bg-opacity-20 text-yellow-400"
                      : "border-gray-600 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <div className="font-semibold">3-Char</div>
                  <div className="text-xs opacity-70">AA0 → 12,960 cells</div>
                </button>
              </div>
            </div>

            {/* Cell count */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span 
                  className="text-xs"
                  style={{ color: "cornsilk", opacity: 0.6 }}
                >
                  Number of Cells (Grid Size)
                </span>
                <button
                  onClick={handleAutoDetect}
                  className="text-xs px-2 py-1 rounded border border-blue-400 text-blue-400 hover:bg-blue-400 hover:bg-opacity-20"
                >
                  Auto-Detect
                </button>
              </div>
              <select
                value={gridConfig.targetCellCount}
                onChange={(e) => setGridConfig(prev => ({ 
                  ...prev, 
                  targetCellCount: parseInt(e.target.value) 
                }))}
                className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
              >
                {cellCountOptions.map((count) => {
                  const gridSize = Math.sqrt(count);
                  return (
                    <option key={count} value={count}>
                      {count} cells ({gridSize}×{gridSize} grid) → {count * 9} positions
                    </option>
                  );
                })}
              </select>
              <p className="text-xs mt-1" style={{ color: "cornsilk", opacity: 0.5 }}>
                Only perfect squares (4×4, 5×5, etc.) for even grid distribution
              </p>
            </div>

            {/* Format explanation */}
            <div 
              className="bg-gray-800 rounded-md p-3 text-xs"
              style={{ color: "cornsilk", opacity: 0.7 }}
            >
              {gridConfig.coordinateMode === "2-char" ? (
                <>
                  <p className="font-semibold mb-1">Input Format: [Char][Char][Subcell]</p>
                  <p>Examples: <span className="font-mono text-yellow-400">AA5</span>, <span className="font-mono text-yellow-400">A15</span>, <span className="font-mono text-yellow-400">9Z3</span></p>
                  <p className="mt-1">• First 2 chars (A-Z, 0-9): Select cell</p>
                  <p>• Third char (1-9): Select subcell for precise click</p>
                  <p className="mt-1 text-yellow-400">Max: 1,296 cells × 9 subcells = 11,664 positions</p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-1">Input Format: [Char][Char][Digit][Subcell]</p>
                  <p>Examples: <span className="font-mono text-yellow-400">AA05</span>, <span className="font-mono text-yellow-400">Z93</span>, <span className="font-mono text-yellow-400">9Z01</span></p>
                  <p className="mt-1">• First 2 chars (A-Z, 0-9): Cell prefix</p>
                  <p>• Third char (0-9): Cell suffix</p>
                  <p>• Fourth char (1-9): Subcell for precise click</p>
                  <p className="mt-1 text-yellow-400">Max: 12,960 cells × 9 subcells = 116,640 positions</p>
                </>
              )}
            </div>
          </div>
        )}

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
