
"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  UploadCloud,
  FileText,
  ClipboardList,
  HelpCircle,
  Loader2,
  Bold,
  Italic,
  Underline,
  Palette,
  Undo,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { pdfSummarizer } from "@/ai/flows/pdf-summarizer";
import {
  generateTestQuestions,
  type TestQuestionGenerationOutput,
} from "@/ai/flows/test-question-generator";
import {
  generateStudyPlan,
  type StudyPlanInput,
  type StudyPlanOutput,
} from "@/ai/flows/study-plan-generator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ElmaYukleme } from "@/components/elma-yukleme";
import { ElmaLogo } from "@/components/elma-logo";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InfoBubble } from "@/components/info-bubble";
import { cn } from "@/lib/utils";

type Question = TestQuestionGenerationOutput["questions"][0];
type UserAnswers = { [key: number]: string };
type Difficulty = "Kolay" | "Orta" | "Zor";

const studyPlanSchema = z.object({
  topicsOfInterest: z.string().optional(),
  timeline: z.string().optional(),
});

function markdownToHtml(markdown: string): string {
    let html = markdown
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/(\*|_)(.*?)\1/g, '<i>$2</i>')
      .replace(/\n\s*\n/g, '</p><p>')
      .replace(/\n/g, '<br />');
  
    if (!html.startsWith('<p>')) {
      html = `<p>${html}</p>`;
    }
    return html;
  }

export default function ElmaPdfPage() {
  const { toast } = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [summary, setSummary] = useState<string | null>(null);
  const [originalSummary, setOriginalSummary] = useState<string | null>(null);
  const [editedSummary, setEditedSummary] = useState<string | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[] | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlanOutput['studyPlan'] | null>(null);
  const [isLoading, setIsLoading] = useState({
    summary: false,
    test: false,
    plan: false,
  });
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [score, setScore] = useState<number | null>(null);
  const [testAttempted, setTestAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const summaryEditorRef = useRef<HTMLDivElement>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("Kolay");
  const [questionCount, setQuestionCount] = useState<string>("10");


  const form = useForm<z.infer<typeof studyPlanSchema>>({
    resolver: zodResolver(studyPlanSchema),
    defaultValues: {
      topicsOfInterest: "",
      timeline: "",
    },
  });

  useEffect(() => {
    if (pdfFile && !summary) {
      setPdfName(pdfFile.name);
      const scoreKey = `elma-pdf-score-${pdfFile.name}`;
      const savedScore = localStorage.getItem(scoreKey);
      if (savedScore) {
        setScore(JSON.parse(savedScore));
      }
      handleGenerateSummary(pdfFile);
    }
  }, [pdfFile, summary]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      resetState();
      setPdfFile(file);
    } else {
      toast({
        variant: "destructive",
        title: "Geçersiz Dosya Türü",
        description: "Lütfen geçerli bir PDF dosyası yükleyin.",
      });
    }
  };

  const resetState = () => {
    setPdfFile(null);
    setPdfName("");
    setSummary(null);
    setOriginalSummary(null);
    setEditedSummary(null);
    setTestQuestions(null);
    setStudyPlan(null);
    setIsLoading({ summary: false, test: false, plan: false });
    setUserAnswers({});
    setScore(null);
    setTestAttempted(false);
    setActiveTab("summary");
    form.reset();
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerateSummary = async (file: File) => {
    setIsLoading((prev) => ({ ...prev, summary: true }));
    try {
      const pdfDataUri = await fileToDataUri(file);
      const result = await pdfSummarizer({ pdfDataUri });
      const htmlSummary = markdownToHtml(result.summary);
      setSummary(htmlSummary);
      setEditedSummary(htmlSummary);
      setOriginalSummary(htmlSummary);
    } catch (error) {
      console.log(error)
      toast({
        variant: "destructive",
        title: "Özet Oluşturulurken Hata Oluştu",
        description: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
      });
      resetState();
    } finally {
      setIsLoading((prev) => ({ ...prev, summary: false }));
    }
  };

  const handleGenerateTest = async () => {
    if (!editedSummary) return;
    setIsLoading((prev) => ({ ...prev, test: true }));
    setTestAttempted(false);
    setUserAnswers({});
    setScore(null);
    try {
      const result = await generateTestQuestions({ 
        pdfContent: editedSummary,
        difficulty: difficulty,
        questionCount: parseInt(questionCount, 10),
    });
      setTestQuestions(result.questions);
      setActiveTab("test");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Test Oluşturulurken Hata Oluştu",
        description: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, test: false }));
    }
  };

  const handleGeneratePlan: SubmitHandler<z.infer<typeof studyPlanSchema>> = async (
    data
  ) => {
    if (!editedSummary) return;
    setIsLoading((prev) => ({ ...prev, plan: true }));
    try {
      const input: StudyPlanInput = {
        pdfContent: editedSummary,
        ...data,
      };
      const result = await generateStudyPlan(input);
      setStudyPlan(result.studyPlan);
      setActiveTab("plan");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Çalışma Planı Oluşturulurken Hata Oluştu",
        description: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, plan: false }));
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const checkScore = () => {
    if (!testQuestions) return;
    let correctAnswers = 0;
    testQuestions.forEach((q, i) => {
      if (userAnswers[i] === q.answer) {
        correctAnswers++;
      }
    });
    const finalScore = Math.round((correctAnswers / testQuestions.length) * 100);
    setScore(finalScore);
    setTestAttempted(true);
    const scoreKey = `elma-pdf-score-${pdfName}`;
    localStorage.setItem(scoreKey, JSON.stringify(finalScore));
    toast({
      title: "Test Gönderildi!",
      description: `Puanınız ${finalScore}%.`,
    });
  };
  
  const applyStyle = (style: "bold" | "italic" | "underline" | "highlight") => {
    const editor = summaryEditorRef.current;
    if (!editor) return;

    document.execCommand('styleWithCSS', false, 'true');

    if (style === 'highlight') {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const parentElement = range.commonAncestorContainer.parentElement;

        if (parentElement && parentElement.style.backgroundColor) {
            document.execCommand('backColor', false, 'transparent');
        } else {
            document.execCommand('hiliteColor', false, '#a5d6a7');
        }
    } else {
        document.execCommand(style, false);
    }
    
    setEditedSummary(editor.innerHTML);
    editor.focus();
  };

  const preventTyping = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isModifierKey = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
    const isNavigationKey = [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'PageUp', 'PageDown', 'Tab'
    ].includes(e.key);
    const isAllowedAction = (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 'z', 'y'].includes(e.key.toLowerCase());

    if (!isModifierKey && !isNavigationKey && !isAllowedAction) {
      e.preventDefault();
    }
  };

  const resetSummary = () => {
    if (originalSummary && summaryEditorRef.current) {
        summaryEditorRef.current.innerHTML = originalSummary;
        setEditedSummary(originalSummary);
    }
  };
  
  const getStudyPlanContentAsHtml = () => {
    if (!studyPlan) return null;
    let html = `<h1>Çalışma Planı: ${pdfName}</h1>`;
    studyPlan.forEach(section => {
        html += `<h2>${section.title}</h2>`;
        html += `<p>${section.content.replace(/\n/g, '<br/>')}</p>`;
    });
    return html;
  };

  const downloadContentAsWord = (content: string | null, fileName: string, title: string) => {
    if (!content) return;
  
    const styles = `<style>
        body { font-family: 'PT Sans', sans-serif; }
        h1, h2, h3 { font-family: 'Playfair Display', serif; }
        .highlight { background-color: #a5d6a7; }
        b { font-weight: bold; }
        i { font-style: italic; }
        u { text-decoration: underline; }
    </style>`;

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
                   "xmlns:w='urn:schemas-microsoft-com:office:word' "+
                   "xmlns='http://www.w3.org/TR/REC-html40'>"+
                   `<head><meta charset='utf-8'><title>${title}</title>${styles}</head><body>`;
    const footer = "</body></html>";
    
    let processedContent = content;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const highlightedSpans = tempDiv.querySelectorAll('span[style*="background-color"]');
    highlightedSpans.forEach(span => {
        const spanElement = span as HTMLElement;
        if (spanElement.style.backgroundColor) { // #a5d6a7
            spanElement.classList.add('highlight');
            spanElement.style.backgroundColor = '';
        }
    });
    processedContent = tempDiv.innerHTML;

    const sourceHTML = header + processedContent + footer;
  
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${pdfName.replace('.pdf', '')}_${fileName}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);

    toast({
        title: `${title} İndirildi`,
        description: `${title} bir Word belgesi olarak indirildi.`,
    });
  };

  const getTestContentAsHtml = () => {
    if (!testQuestions) return null;

    let html = `<h1>Bilgi Testi: ${pdfName}</h1>`;
    testQuestions.forEach((q, i) => {
        html += `<p><b>${i + 1}. ${q.question}</b></p>`;
        html += "<ul>";
        q.options.forEach(opt => {
            let answerIndicator = "";
            if (testAttempted) {
                if (opt === q.answer) {
                    answerIndicator = " (Doğru Cevap)";
                }
                if (opt === userAnswers[i] && opt !== q.answer) {
                    answerIndicator = " (Sizin Cevabınız)";
                }
            }
            html += `<li>${opt}${answerIndicator}</li>`;
        });
        html += "</ul>";
        if (testAttempted) {
          html += `<p><i>Doğru Cevap: ${q.answer}</i></p><br/>`;
        }
    });

    if (score !== null) {
        html += `<h2>Puanınız: ${score}%</h2>`;
    }

    return html;
  };
  
  const resetTest = () => {
    setTestQuestions(null);
    setTestAttempted(false);
    setUserAnswers({});
    setScore(null);
  };

  const renderStudyPlan = () => {
    if (!studyPlan) return null;
    return (
      <div className="prose prose-sm max-w-none p-4 border rounded-md bg-white">
        {studyPlan.map((section, index) => (
          <div key={index} className="mb-4">
            <h3 className="font-bold text-lg mb-2">{section.title}</h3>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {section.content}
            </ReactMarkdown>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading.summary || isLoading.test || isLoading.plan) {
      return (
        <div className="flex flex-col items-center justify-center h-full pt-16">
            <ElmaYukleme className="h-48 w-48" />
            <p className="text-lg mt-4 text-primary animate-pulse">
                {isLoading.summary && "Özet oluşturuluyor..."}
                {isLoading.test && "Test oluşturuluyor..."}
                {isLoading.plan && "Çalışma planı oluşturuluyor..."}
            </p>
        </div>
      );
    }

    if (summary) {
      return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="summary">
              <FileText className="mr-2 h-4 w-4" /> Özet
            </TabsTrigger>
            <TabsTrigger value="test">
              <HelpCircle className="mr-2 h-4 w-4" /> Kendini Test Et
            </TabsTrigger>
            <TabsTrigger value="plan">
              <ClipboardList className="mr-2 h-4 w-4" /> Çalışma Planı
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="mt-4 min-h-[600px]">
            <Card>
              <CardHeader className="sticky top-0 bg-card z-10 border-b">
                 <div className="flex justify-between items-center">
                   <CardTitle className="font-headline">Düzenlenebilir Özet</CardTitle>
                   <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => applyStyle('bold')} title="Kalın"><Bold className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => applyStyle('italic')} title="İtalik"><Italic className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => applyStyle('underline')} title="Altı Çizili"><Underline className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => applyStyle('highlight')} title="Metni Vurgula"><Palette className="h-4 w-4 text-primary" /></Button>
                    <Button variant="default" size="icon" onClick={resetSummary} title="Özeti Sıfırla"><Undo className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => downloadContentAsWord(summaryEditorRef.current?.innerHTML || editedSummary, 'özet', 'Özet')} title="Özeti İndir"><Download className="h-4 w-4 mr-2" /> İndir</Button>
                  </div>
                 </div>
              </CardHeader>
              <CardContent className="pt-6">
              <div
                  ref={summaryEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="prose prose-sm max-w-none p-4 border rounded-md min-h-[400px] bg-white focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={preventTyping}
                  onDrop={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  dangerouslySetInnerHTML={{ __html: editedSummary || "" }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="mt-4 min-h-[600px]">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="font-headline">Bilgini Test Et</CardTitle>
                {testQuestions && (
                   <Button variant="destructive" size="sm" onClick={() => downloadContentAsWord(getTestContentAsHtml(), 'test', 'Test Soruları')} title="Testi İndir"><Download className="h-4 w-4 mr-2" /> İndir</Button>
                )}
              </CardHeader>
              <CardContent>
                {!testQuestions ? (
                  <div className="text-center py-8">
                     <div className="max-w-md mx-auto space-y-6">
                        <div>
                            <Label className="font-semibold">Test Zorluğu</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setDifficulty("Kolay")}
                                    className={cn(difficulty === 'Kolay' && 'bg-green-600 hover:bg-green-700 text-white')}>
                                    Kolay
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setDifficulty("Orta")}
                                    className={cn(difficulty === 'Orta' && 'bg-yellow-500 hover:bg-yellow-600 text-white')}>
                                    Orta
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setDifficulty("Zor")}
                                    className={cn(difficulty === 'Zor' && 'bg-red-600 hover:bg-red-700 text-white')}>
                                    Zor
                                </Button>
                            </div>
                        </div>
                        <div>
                        <Label htmlFor="question-count" className="font-semibold">Soru Sayısı</Label>
                        <Select onValueChange={setQuestionCount} defaultValue={questionCount}>
                            <SelectTrigger id="question-count" className="mt-2">
                                <SelectValue placeholder="Soru sayısı seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 Soru</SelectItem>
                                <SelectItem value="20">20 Soru</SelectItem>
                                <SelectItem value="25">25 Soru</SelectItem>
                                <SelectItem value="40">40 Soru</SelectItem>
                                <SelectItem value="50">50 Soru</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <Button onClick={handleGenerateTest} disabled={!editedSummary} size="lg" className="w-full">
                            <HelpCircle className="mr-2 h-4 w-4" /> Test Oluştur
                        </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {testQuestions.map((q, i) => (
                      <div key={i} className="border-b pb-4">
                        <p className="font-semibold mb-2">{i + 1}. {q.question}</p>
                        <RadioGroup onValueChange={(value) => handleAnswerChange(i, value)} value={userAnswers[i] || ''} disabled={testAttempted}>
                          {q.options.map((opt, j) => (
                            <div key={j} className="flex items-center space-x-2">
                              <RadioGroupItem value={opt} id={`q${i}-opt${j}`} />
                              <Label htmlFor={`q${i}-opt${j}`} className={`cursor-pointer ${testAttempted ? (opt === q.answer ? 'text-green-700' : (opt === userAnswers[i] ? 'text-red-700' : '')) : ''}`}>
                                {opt}
                                {testAttempted && opt === q.answer && <CheckCircle2 className="inline ml-2 h-4 w-4 text-green-700" />}
                                {testAttempted && opt !== q.answer && opt === userAnswers[i] && <XCircle className="inline ml-2 h-4 w-4 text-red-700" />}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                    {!testAttempted ? (
                      <Button onClick={checkScore}>Cevapları Kontrol Et</Button>
                    ) : (
                       <div className="p-4 rounded-md bg-primary text-center">
                        <p className="font-bold text-lg text-primary-foreground">Puanınız: {score}%</p>
                        <Button onClick={resetTest} variant="link" className="mt-2 text-primary-foreground underline">Yeni bir test dene</Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan" className="mt-4 min-h-[600px]">
            <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="font-headline">Çalışma Planı Oluştur</CardTitle>
                {studyPlan && (
                  <Button variant="destructive" size="sm" onClick={() => downloadContentAsWord(getStudyPlanContentAsHtml(), 'çalışma-planı', 'Çalışma Planı')} title="Çalışma Planını İndir"><Download className="h-4 w-4 mr-2" /> İndir</Button>
                )}
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleGeneratePlan)} className="space-y-4 mb-6">
                    <FormField control={form.control} name="topicsOfInterest" render={({ field }) => (
                      <FormItem>
                        <FormLabel>İlgilenilen Konular (isteğe bağlı)</FormLabel>
                        <FormControl><Input placeholder="örn. Bölüm 3, anahtar formüller" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="timeline" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zaman Çizelgesi (isteğe bağlı)</FormLabel>
                        <FormControl><Input placeholder="örn. 1 hafta, 3 gün" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={!editedSummary}>
                      Plan Oluştur
                    </Button>
                  </form>
                </Form>
                {renderStudyPlan()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center">
        <Card className="mt-8 w-full max-w-lg mx-auto border-2 border-primary/20 bg-primary/10 rounded-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-center font-headline text-2xl">
              PDF'inizi Yükleyin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/50 rounded-lg bg-background/80">
              <UploadCloud className="h-16 w-16 text-destructive" />
              <p className="mt-4 text-muted-foreground">
                Sürükleyip bırakın veya yüklemek için tıklayın
              </p>
              <Input
                id="pdf-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="application/pdf"
              />
              <Button
                asChild
                className="mt-4 transition-transform hover:-translate-y-1"
                aria-label="PDF Yükle"
                variant="destructive"
              >
                <Label htmlFor="pdf-upload">Dosya Seç</Label>
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="mt-8 text-center">
          <div className="flex justify-center">
              <ElmaLogo className="h-24 w-24 animate-float" />
          </div>
          <InfoBubble />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-4 px-8 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary">
            ElmaPDF
          </h1>
        </div>
        {pdfName && !isLoading.summary && (
          <div className="mt-2 flex justify-between items-center">
             <p className="text-sm text-muted-foreground">Üzerinde çalışılıyor: <span className="font-semibold text-foreground">{pdfName}</span></p>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="default" size="sm">Yeni PDF Yükle</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu işlem mevcut çalışmanızı sıfırlayacak. Devam etmek istediğinizden emin misiniz?
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={resetState}>Devam Et</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
          </div>
        )}
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <footer className="text-center py-4 border-t text-sm text-muted-foreground">
        Öğrenme deneyiminizi geliştirmek için yapay zeka ile güçlendirilmiştir.
      </footer>
    </div>
  );
}
