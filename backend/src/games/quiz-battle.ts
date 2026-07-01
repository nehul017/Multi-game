import { GameEngine } from './engine';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit: number;
}

interface PlayerScore {
  playerId: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  streak: number;
  bestStreak: number;
  answers: { questionId: number; answer: number; correct: boolean; timeMs: number }[];
}

const QUESTION_BANK: Question[] = [
  { id: 1, question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correctAnswer: 2, category: 'Geography', difficulty: 'easy', points: 10, timeLimit: 15000 },
  { id: 2, question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctAnswer: 1, category: 'Science', difficulty: 'easy', points: 10, timeLimit: 15000 },
  { id: 3, question: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 3, category: 'Geography', difficulty: 'easy', points: 10, timeLimit: 15000 },
  { id: 4, question: 'Who painted the Mona Lisa?', options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Rembrandt'], correctAnswer: 1, category: 'Art', difficulty: 'easy', points: 10, timeLimit: 15000 },
  { id: 5, question: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctAnswer: 2, category: 'Science', difficulty: 'medium', points: 20, timeLimit: 20000 },
  { id: 6, question: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctAnswer: 2, category: 'History', difficulty: 'medium', points: 20, timeLimit: 20000 },
  { id: 7, question: 'What is the square root of 144?', options: ['10', '11', '12', '13'], correctAnswer: 2, category: 'Math', difficulty: 'easy', points: 10, timeLimit: 15000 },
  { id: 8, question: 'Which element has the atomic number 1?', options: ['Helium', 'Hydrogen', 'Lithium', 'Carbon'], correctAnswer: 1, category: 'Science', difficulty: 'easy', points: 10, timeLimit: 15000 },
  { id: 9, question: 'What is the largest mammal?', options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippo'], correctAnswer: 1, category: 'Science', difficulty: 'easy', points: 10, timeLimit: 15000 },
  { id: 10, question: 'Who wrote Romeo and Juliet?', options: ['Dickens', 'Shakespeare', 'Austen', 'Twain'], correctAnswer: 1, category: 'Literature', difficulty: 'easy', points: 10, timeLimit: 15000 },
  { id: 11, question: 'What is the speed of light in km/s (approx)?', options: ['100,000', '200,000', '300,000', '400,000'], correctAnswer: 2, category: 'Science', difficulty: 'hard', points: 30, timeLimit: 25000 },
  { id: 12, question: 'Which programming language was created by Brendan Eich?', options: ['Python', 'Java', 'JavaScript', 'C++'], correctAnswer: 2, category: 'Technology', difficulty: 'medium', points: 20, timeLimit: 20000 },
  { id: 13, question: 'What is the Fibonacci sequence\'s 7th number?', options: ['8', '13', '21', '34'], correctAnswer: 1, category: 'Math', difficulty: 'medium', points: 20, timeLimit: 20000 },
  { id: 14, question: 'Which country has the most time zones?', options: ['Russia', 'USA', 'China', 'France'], correctAnswer: 3, category: 'Geography', difficulty: 'hard', points: 30, timeLimit: 25000 },
  { id: 15, question: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctAnswer: 2, category: 'Science', difficulty: 'easy', points: 10, timeLimit: 15000 },
];

export class QuizBattle extends GameEngine {
  private scores: PlayerScore[];
  private questions: Question[];
  private currentQuestionIndex: number;
  private roundAnswers: Map<string, { answer: number; timeMs: number }>;
  private totalRounds: number;
  private roundStartTime: number;

  constructor(players: string[], options: { rounds?: number; category?: string } = {}) {
    super(players);
    this.scores = [];
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.roundAnswers = new Map();
    this.totalRounds = Math.min(options.rounds || 10, QUESTION_BANK.length);
    this.roundStartTime = Date.now();
    this.initGame();
  }

  initGame(): void {
    this.scores = this.state.players.map((playerId) => ({
      playerId,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      streak: 0,
      bestStreak: 0,
      answers: [],
    }));

    const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
    this.questions = shuffled.slice(0, this.totalRounds);
    this.currentQuestionIndex = 0;
    this.roundAnswers = new Map();
    this.roundStartTime = Date.now();

    this.state.board = {
      currentQuestion: this.getCurrentQuestionSafe(),
      questionNumber: 1,
      totalQuestions: this.totalRounds,
      scores: this.scores,
    };
    this.state.status = 'playing';
  }

  validateMove(player: string, move: Record<string, unknown>): boolean {
    if (this.isGameOver()) return false;

    const action = move.action as string;
    if (action !== 'answer') return false;

    const answer = move.answer as number;
    if (typeof answer !== 'number' || answer < 0 || answer > 3) return false;

    if (this.roundAnswers.has(player)) return false;

    return true;
  }

  makeMove(player: string, move: Record<string, unknown>): boolean {
    if (!this.validateMove(player, move)) return false;

    const answer = move.answer as number;
    const timeMs = Date.now() - this.roundStartTime;
    const question = this.questions[this.currentQuestionIndex];

    this.roundAnswers.set(player, { answer, timeMs });

    const isCorrect = answer === question.correctAnswer;
    const playerScore = this.scores.find((s) => s.playerId === player)!;

    if (isCorrect) {
      const timeBonus = Math.max(0, Math.floor((question.timeLimit - timeMs) / 1000));
      const streakBonus = Math.floor(playerScore.streak * 5);
      const points = question.points + timeBonus + streakBonus;

      playerScore.score += points;
      playerScore.correctAnswers++;
      playerScore.streak++;
      playerScore.bestStreak = Math.max(playerScore.bestStreak, playerScore.streak);
    } else {
      playerScore.wrongAnswers++;
      playerScore.streak = 0;
    }

    playerScore.answers.push({
      questionId: question.id,
      answer,
      correct: isCorrect,
      timeMs,
    });

    this.addMoveToHistory(player, 'answer', {
      questionId: question.id,
      answer,
      correct: isCorrect,
      timeMs,
    });

    if (this.roundAnswers.size >= this.state.players.length) {
      this.nextRound();
    }

    return true;
  }

  private nextRound(): void {
    this.currentQuestionIndex++;
    this.roundAnswers = new Map();
    this.roundStartTime = Date.now();

    if (this.currentQuestionIndex >= this.questions.length) {
      const winner = this.checkWin();
      this.endGame(winner);
    }

    this.state.board = {
      currentQuestion: this.currentQuestionIndex < this.questions.length
        ? this.getCurrentQuestionSafe()
        : null,
      questionNumber: this.currentQuestionIndex + 1,
      totalQuestions: this.totalRounds,
      scores: this.scores,
    };
  }

  private getCurrentQuestionSafe() {
    const q = this.questions[this.currentQuestionIndex];
    if (!q) return null;
    return {
      id: q.id,
      question: q.question,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty,
      points: q.points,
      timeLimit: q.timeLimit,
    };
  }

  checkWin(): string | null {
    if (this.currentQuestionIndex < this.questions.length) return null;

    const sorted = [...this.scores].sort((a, b) => b.score - a.score);
    if (sorted.length >= 2 && sorted[0].score === sorted[1].score) return null;

    return sorted[0]?.playerId || null;
  }

  checkDraw(): boolean {
    if (this.currentQuestionIndex < this.questions.length) return false;

    const sorted = [...this.scores].sort((a, b) => b.score - a.score);
    return sorted.length >= 2 && sorted[0].score === sorted[1].score;
  }

  getValidMoves(_player: string): Record<string, unknown>[] {
    if (this.isGameOver()) return [];
    return [
      { action: 'answer', answer: 0 },
      { action: 'answer', answer: 1 },
      { action: 'answer', answer: 2 },
      { action: 'answer', answer: 3 },
    ];
  }

  getScores(): PlayerScore[] {
    return [...this.scores].sort((a, b) => b.score - a.score);
  }
}
