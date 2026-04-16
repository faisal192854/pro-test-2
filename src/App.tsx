import { useState, useEffect } from 'react';
import { 
  Pipette, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Settings, 
  Palette as PaletteIcon, 
  ExternalLink,
  Github
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  getColorInfo, 
  extractColorsFromDocument, 
  generateExport,
  ColorInfo 
} from '@/src/lib/color-utils';
import confetti from 'canvas-confetti';

interface Palette {
  id: string;
  name: string;
  colors: ColorInfo[];
}

export default function App() {
  const [activePalette, setActivePalette] = useState<Palette | null>(null);
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [pageColors, setPageColors] = useState<{ backgrounds: string[], texts: string[], accents: string[] }>({
    backgrounds: [],
    texts: [],
    accents: []
  });
  const [exportFormat, setExportFormat] = useState<'css' | 'tailwind' | 'figma'>('css');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNewPaletteOpen, setIsNewPaletteOpen] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState('');

  // Load palettes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chroma-palettes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPalettes(parsed);
        if (parsed.length > 0) setActivePalette(parsed[0]);
      } catch (e) {
        console.error('Failed to parse palettes', e);
      }
    } else {
      const defaultPalette: Palette = {
        id: 'default',
        name: 'My First Palette',
        colors: [
          getColorInfo('#3E5BFF'),
          getColorInfo('#FF6B6B'),
          getColorInfo('#FFBD2E')
        ]
      };
      setPalettes([defaultPalette]);
      setActivePalette(defaultPalette);
    }
  }, []);

  // Save palettes to localStorage
  useEffect(() => {
    if (palettes.length > 0) {
      localStorage.setItem('chroma-palettes', JSON.stringify(palettes));
    }
  }, [palettes]);

  // Extract page colors on mount
  useEffect(() => {
    const colors = extractColorsFromDocument();
    setPageColors(colors);
  }, []);

  const handlePickColor = async () => {
    if (!('EyeDropper' in window)) {
      toast.error('EyeDropper API is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      const colorInfo = getColorInfo(result.sRGBHex);
      
      if (activePalette) {
        const updatedPalettes = palettes.map(p => 
          p.id === activePalette.id 
            ? { ...p, colors: [...p.colors, colorInfo] } 
            : p
        );
        setPalettes(updatedPalettes);
        setActivePalette(updatedPalettes.find(p => p.id === activePalette.id) || null);
        toast.success(`Picked ${colorInfo.hex}`);
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: [colorInfo.hex]
        });
      }
    } catch (e) {
      console.log('EyeDropper cancelled or failed', e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied: ${text}`);
  };

  const createPalette = () => {
    if (!newPaletteName.trim()) return;
    const newPalette: Palette = {
      id: Date.now().toString(),
      name: newPaletteName,
      colors: []
    };
    setPalettes([...palettes, newPalette]);
    setActivePalette(newPalette);
    setNewPaletteName('');
    setIsNewPaletteOpen(false);
    toast.success(`Created palette: ${newPalette.name}`);
  };

  const deletePalette = (id: string) => {
    const updated = palettes.filter(p => p.id !== id);
    setPalettes(updated);
    if (activePalette?.id === id) {
      setActivePalette(updated[0] || null);
    }
    toast.info('Palette deleted');
  };

  const removeColor = (paletteId: string, colorHex: string) => {
    const updated = palettes.map(p => 
      p.id === paletteId 
        ? { ...p, colors: p.colors.filter(c => c.hex !== colorHex) } 
        : p
    );
    setPalettes(updated);
    if (activePalette?.id === paletteId) {
      setActivePalette(updated.find(p => p.id === paletteId) || null);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-[340px] min-h-[500px] bg-background text-foreground font-sans selection:bg-primary/20 overflow-hidden">
        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center p-0">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Card className="bg-card border-none shadow-none rounded-none overflow-hidden">
              <CardHeader className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                      <Pipette className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold tracking-tight">Chroma Studio</CardTitle>
                      <CardDescription className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Color Intelligence</CardDescription>
                    </div>
                  </div>
                  <Button 
                    onClick={handlePickColor}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-[11px] font-bold px-4 rounded-full shadow-md shadow-primary/10 transition-all hover:scale-105 active:scale-95"
                  >
                    PICK COLOR
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Tabs defaultValue="palettes" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 bg-muted/30 rounded-none border-b border-border h-11 p-1">
                    <TabsTrigger value="palettes" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-[11px] font-semibold rounded-md transition-all">Palettes</TabsTrigger>
                    <TabsTrigger value="extract" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-[11px] font-semibold rounded-md transition-all">Extract</TabsTrigger>
                    <TabsTrigger value="export" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-[11px] font-semibold rounded-md transition-all">Export</TabsTrigger>
                  </TabsList>

                  {/* Palettes Tab */}
                  <TabsContent value="palettes" className="m-0 focus-visible:outline-none">
                    <div className="space-y-0">
                      <div className="p-3 bg-muted/10 border-b border-border flex items-center gap-2">
                        <div className="relative flex-1">
                          <select 
                            className="w-full bg-card border border-border text-xs rounded-lg pl-3 pr-8 py-1.5 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
                            value={activePalette?.id}
                            onChange={(e) => setActivePalette(palettes.find(p => p.id === e.target.value) || null)}
                          >
                            {palettes.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <PaletteIcon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 border-border bg-card hover:bg-muted rounded-lg transition-colors"
                          onClick={() => setIsNewPaletteOpen(true)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Captures</span>
                        <span className="text-[10px] font-medium text-muted-foreground/60">{activePalette?.colors.length || 0} colors</span>
                      </div>
                      
                      <ScrollArea className="h-[320px] px-4">
                        <div className="space-y-1 pb-4">
                          {activePalette?.colors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/40 space-y-3">
                              <div className="p-4 bg-muted/20 rounded-full">
                                <Pipette className="w-8 h-8" />
                              </div>
                              <p className="text-[11px] font-bold uppercase tracking-wider">No colors captured yet</p>
                            </div>
                          ) : (
                            activePalette?.colors.map((color, idx) => (
                              <motion.div 
                                key={`${color.hex}-${idx}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all cursor-default"
                              >
                                <div 
                                  className="w-10 h-10 rounded-lg border border-black/5 shadow-sm shrink-0 transition-transform group-hover:scale-105"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-bold truncate">{color.name || 'Color'}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => copyToClipboard(color.hex)}
                                        className="p-1.5 hover:bg-primary/10 rounded-md text-primary transition-colors"
                                        title="Copy HEX"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => removeColor(activePalette.id, color.hex)}
                                        className="p-1.5 hover:bg-destructive/10 rounded-md text-destructive transition-colors"
                                        title="Remove"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-tight">{color.hex}</span>
                                    <div className="w-1 h-1 rounded-full bg-border" />
                                    <span className="text-[10px] font-mono font-medium text-muted-foreground/60 uppercase tracking-tight">{color.rgb}</span>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>

                  {/* Extract Tab */}
                  <TabsContent value="extract" className="m-0 focus-visible:outline-none">
                    <div className="p-4 space-y-6">
                      <section>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Key Page Colors</h3>
                          <div className="h-px flex-1 bg-border ml-3" />
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-2">
                            <button 
                              onClick={() => pageColors.backgrounds[0] && copyToClipboard(pageColors.backgrounds[0])}
                              className="w-full aspect-square rounded-xl border border-border shadow-sm hover:scale-105 transition-transform relative overflow-hidden group"
                              style={{ backgroundColor: pageColors.backgrounds[0] || '#FFFFFF' }}
                            >
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                <Copy className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                              </div>
                            </button>
                            <div className="text-[9px] font-bold text-center text-muted-foreground uppercase tracking-tighter">BG</div>
                          </div>
                          <div className="space-y-2">
                            <button 
                              onClick={() => pageColors.texts[0] && copyToClipboard(pageColors.texts[0])}
                              className="w-full aspect-square rounded-xl border border-border shadow-sm hover:scale-105 transition-transform relative overflow-hidden group"
                              style={{ backgroundColor: pageColors.texts[0] || '#000000' }}
                            >
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                <Copy className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                              </div>
                            </button>
                            <div className="text-[9px] font-bold text-center text-muted-foreground uppercase tracking-tighter">TEXT</div>
                          </div>
                          {pageColors.accents.slice(0, 2).map((color, i) => (
                            <div key={i} className="space-y-2">
                              <button 
                                onClick={() => copyToClipboard(color)}
                                className="w-full aspect-square rounded-xl border border-border shadow-sm hover:scale-105 transition-transform relative overflow-hidden group"
                                style={{ backgroundColor: color }}
                              >
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                  <Copy className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                </div>
                              </button>
                              <div className="text-[9px] font-bold text-center text-muted-foreground uppercase tracking-tighter">{i === 0 ? 'ACCENT' : 'LINK'}</div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">All Detected</h3>
                          <div className="h-px flex-1 bg-border ml-3" />
                        </div>
                        <ScrollArea className="h-[220px]">
                          <div className="grid grid-cols-6 gap-2 pr-4">
                            {[...pageColors.backgrounds, ...pageColors.texts, ...pageColors.accents].slice(0, 24).map((color, i) => (
                              <button 
                                key={i}
                                onClick={() => copyToClipboard(color)}
                                className="aspect-square rounded-lg border border-border shadow-xs hover:scale-110 transition-transform relative overflow-hidden group"
                                style={{ backgroundColor: color }}
                              >
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </section>
                    </div>
                  </TabsContent>

                  {/* Export Tab */}
                  <TabsContent value="export" className="m-0 focus-visible:outline-none">
                    <div className="p-5 space-y-6">
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Download className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-bold">Export Palette</h4>
                            <p className="text-[10px] text-muted-foreground font-medium">Choose your preferred format</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => { setExportFormat('css'); setIsExportOpen(true); }}
                            className="bg-card border-border hover:bg-muted hover:border-primary/30 justify-between h-11 rounded-xl group transition-all"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-wider">CSS Variables</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => { setExportFormat('tailwind'); setIsExportOpen(true); }}
                            className="bg-card border-border hover:bg-muted hover:border-primary/30 justify-between h-11 rounded-xl group transition-all"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-wider">Tailwind Config</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => { setExportFormat('figma'); setIsExportOpen(true); }}
                            className="bg-card border-border hover:bg-muted hover:border-primary/30 justify-between h-11 rounded-xl group transition-all"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-wider">Figma JSON</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-4 text-muted-foreground/40">
                        <Github className="w-4 h-4 hover:text-foreground transition-colors cursor-pointer" />
                        <Settings className="w-4 h-4 hover:text-foreground transition-colors cursor-pointer" />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Dialogs */}
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogContent className="bg-card border-border text-foreground max-w-[300px] rounded-2xl shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-5 pb-0">
              <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                Export {exportFormat.toUpperCase()}
              </DialogTitle>
              <DialogDescription className="text-[11px] font-medium text-muted-foreground">
                Copy the code snippet below.
              </DialogDescription>
            </DialogHeader>
            <div className="p-5 pt-4">
              <div className="relative">
                <pre className="bg-muted/30 p-4 rounded-xl text-[10px] font-mono overflow-x-auto border border-border max-h-[240px] leading-relaxed">
                  {activePalette ? generateExport(activePalette.colors.map(c => c.hex), exportFormat) : ''}
                </pre>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="absolute top-2 right-2 h-8 w-8 rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all"
                  onClick={() => {
                    const code = activePalette ? generateExport(activePalette.colors.map(c => c.hex), exportFormat) : '';
                    copyToClipboard(code);
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <DialogFooter className="p-5 pt-0">
              <Button onClick={() => setIsExportOpen(false)} className="w-full bg-foreground hover:bg-foreground/90 text-background text-[11px] font-bold h-10 rounded-xl">DONE</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isNewPaletteOpen} onOpenChange={setIsNewPaletteOpen}>
          <DialogContent className="bg-card border-border text-foreground max-w-[300px] rounded-2xl shadow-2xl p-5">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                New Palette
              </DialogTitle>
              <DialogDescription className="text-[11px] font-medium text-muted-foreground">
                Name your color collection.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="e.g. Brand Colors" 
                value={newPaletteName}
                onChange={(e) => setNewPaletteName(e.target.value)}
                className="bg-muted/20 border-border focus:ring-primary/20 text-xs h-10 rounded-xl px-4"
                onKeyDown={(e) => e.key === 'Enter' && createPalette()}
                autoFocus
              />
            </div>
            <DialogFooter className="flex flex-row gap-2">
              <Button variant="ghost" onClick={() => setIsNewPaletteOpen(false)} className="flex-1 text-[11px] font-bold h-10 rounded-xl">CANCEL</Button>
              <Button onClick={createPalette} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold h-10 rounded-xl shadow-lg shadow-primary/20">CREATE</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Toaster position="bottom-center" toastOptions={{
          className: 'rounded-xl border-border bg-card text-foreground text-[11px] font-bold shadow-xl',
        }} />
      </div>
    </TooltipProvider>
  );
}
