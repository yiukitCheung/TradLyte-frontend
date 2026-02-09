import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WisdomQuote from '@/components/WisdomQuote';
import JournalPurposePrompt from '@/components/JournalPurposePrompt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, TrendingUp, TrendingDown, Lightbulb, Award, Trophy, Star, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import mascotImage from '@/assets/tradlyte-mascot.png';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, subMonths, subYears } from 'date-fns';

const Journal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [journalText, setJournalText] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [selectedStock, setSelectedStock] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([
    { role: 'ai', text: "Hi! I'm Tradlyte, your journaling companion. Let's reflect on your trading journey today! Pick a prompt or stock to get started." }
  ]);

  // Placeholder data
  const journalPrompts = [
    { id: 'win', label: 'Today\'s Win', icon: TrendingUp, color: 'text-green-500' },
    { id: 'loss', label: 'Today\'s Loss', icon: TrendingDown, color: 'text-red-500' },
    { id: 'reflection', label: 'Reflection', icon: Lightbulb, color: 'text-yellow-500' },
    { id: 'lesson', label: 'Lesson Learned', icon: BookOpen, color: 'text-blue-500' },
  ];

  const stocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA'];

  const milestones = [
    { date: '2024-10-15', title: 'First Profitable Trade', points: 100 },
    { date: '2024-11-01', title: '10 Journals Completed', points: 50 },
    { date: '2024-12-10', title: 'Consistent Journaling Streak', points: 200 },
  ];

  const journalEntries = [
    { date: '2025-01-15', stock: 'AAPL', type: 'win', excerpt: 'Great entry on dip...' },
    { date: '2025-01-10', stock: 'TSLA', type: 'reflection', excerpt: 'Need to work on patience...' },
    { date: '2025-01-05', stock: 'GOOGL', type: 'loss', excerpt: 'Exit too early, missed gains...' },
  ];

  const totalPoints = milestones.reduce((sum, m) => sum + m.points, 0);
  const nextRewardAt = 500;

  const handlePromptSelect = (promptId: string) => {
    setSelectedPrompt(promptId);
    const prompt = journalPrompts.find(p => p.id === promptId);
    setChatMessages(prev => [...prev, 
      { role: 'user', text: `I want to write about: ${prompt?.label}` },
      { role: 'ai', text: `Great choice! ${prompt?.label} is important for growth. What happened today?` }
    ]);
  };

  const handlePurposePromptSelect = (promptText: string) => {
    setChatMessages(prev => [...prev,
      { role: 'user', text: promptText },
      { role: 'ai', text: 'That\'s a thoughtful question. Take your time to reflect deeply on this.' }
    ]);
    setJournalText(promptText + '\n\n');
  };

  const handleStockSelect = (stock: string) => {
    setSelectedStock(stock);
    setChatMessages(prev => [...prev,
      { role: 'user', text: `I want to journal about ${stock}` },
      { role: 'ai', text: `Perfect! How did your ${stock} position perform today? What decisions did you make?` }
    ]);
  };

  const handleSaveJournal = () => {
    if (!journalText.trim()) {
      toast({
        title: "Journal is empty",
        description: "Please write something before saving.",
        variant: "destructive"
      });
      return;
    }

    // TODO: Save to database
    toast({
      title: "Journal saved!",
      description: "+25 points earned for journaling today!",
    });
    setJournalText('');
    setSelectedPrompt('');
    setSelectedStock('');
  };

  const timeTravel = (period: 'day' | 'week' | 'month' | 'year') => {
    let newDate = new Date();
    switch(period) {
      case 'day': newDate = subDays(selectedDate, 1); break;
      case 'week': newDate = subDays(selectedDate, 7); break;
      case 'month': newDate = subMonths(selectedDate, 1); break;
      case 'year': newDate = subYears(selectedDate, 1); break;
    }
    setSelectedDate(newDate);
    toast({
      title: "Time traveled!",
      description: `Viewing journals from ${format(newDate, 'MMMM d, yyyy')}`,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access your journal</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Wisdom Quote */}
          <WisdomQuote />

          {/* Header with Rewards */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Trading Journal</h1>
              <p className="text-muted-foreground">Reflect, learn, and grow with Tradlyte</p>
            </div>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-xl font-bold">{totalPoints} Points</span>
                    </div>
                    <Progress value={(totalPoints / nextRewardAt) * 100} className="w-40 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">{nextRewardAt - totalPoints} to next reward</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI Assistant & Writing Area */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* AI Chat */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <img src={mascotImage} alt="Tradlyte" className="w-12 h-12 rounded-full" />
                    <div>
                      <CardTitle>Tradlyte Assistant</CardTitle>
                      <CardDescription>Your friendly journaling guide</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex items-start gap-3 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
                        {msg.role === 'ai' && (
                          <img src={mascotImage} alt="AI" className="w-8 h-8 rounded-full flex-shrink-0" />
                        )}
                        <div className={`rounded-lg p-3 max-w-[80%] ${
                          msg.role === 'ai' 
                            ? 'bg-accent/20 text-foreground' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Choose a prompt:</p>
                      <div className="flex flex-wrap gap-2">
                        {journalPrompts.map(prompt => (
                          <Button
                            key={prompt.id}
                            variant={selectedPrompt === prompt.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePromptSelect(prompt.id)}
                          >
                            <prompt.icon className={`h-4 w-4 mr-2 ${prompt.color}`} />
                            {prompt.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Select a stock:</p>
                      <Select value={selectedStock} onValueChange={handleStockSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a stock to journal about" />
                        </SelectTrigger>
                        <SelectContent>
                          {stocks.map(stock => (
                            <SelectItem key={stock} value={stock}>{stock}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Journal Writing Area */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Write Your Journal</CardTitle>
                  <CardDescription>
                    {selectedPrompt && `Topic: ${journalPrompts.find(p => p.id === selectedPrompt)?.label}`}
                    {selectedStock && ` | Stock: ${selectedStock}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Start writing your thoughts, observations, and learnings here..."
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {journalText.length} characters
                    </p>
                    <Button onClick={handleSaveJournal}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Save Journal Entry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline & Milestones Sidebar */}
            <div className="space-y-6">
              
              {/* Purpose Prompts */}
              <JournalPurposePrompt onSelectPrompt={handlePurposePromptSelect} />

              {/* Time Travel */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Time Travel</CardTitle>
                  <CardDescription>Navigate your journal history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="outline" size="icon" onClick={() => timeTravel('day')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[200px]">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedDate, 'MMM d, yyyy')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" onClick={() => setSelectedDate(new Date())}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => timeTravel('week')}>
                      1 Week Ago
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => timeTravel('month')}>
                      1 Month Ago
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => timeTravel('year')}>
                      1 Year Ago
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedDate(new Date())}>
                      Today
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {milestones.map((milestone, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 border border-border">
                        <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{milestone.title}</p>
                          <p className="text-xs text-muted-foreground">{milestone.date}</p>
                          <Badge variant="secondary" className="mt-1">+{milestone.points} pts</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Entries */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {journalEntries.map((entry, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left p-3 rounded-lg bg-background hover:bg-accent/20 border border-border transition-colors"
                        onClick={() => setSelectedDate(new Date(entry.date))}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{entry.date}</span>
                          <Badge variant="outline" className="text-xs">{entry.stock}</Badge>
                        </div>
                        <p className="text-sm truncate">{entry.excerpt}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Journal;