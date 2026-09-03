/**
 * Seed question bank.
 *
 * IMPORTANT — every question here is an ORIGINAL MODEL QUESTION written
 * against the syllabus. None of it is presented as an authentic past-paper
 * question (see docs/ARCHITECTURE.md §0.1 and the brief's §29).
 *
 * Real past-paper items are seeded separately, as drafts, in
 * ./past-paper-questions.ts — which is what the review workflow exists to
 * resolve.
 *
 * Every arithmetic answer below is verified by a test in ./questions.test.ts.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Cognitive = 'recall' | 'understanding' | 'application' | 'analysis';

export type QuestionSeed = {
  /** Syllabus topic code, e.g. '3.3'. */
  topic: string;
  stem: string;
  options: [string, string, string, string];
  /** 0-based index into `options`. */
  correct: 0 | 1 | 2 | 3;
  /** Why a student would pick each wrong option. '' for the correct one. */
  misconceptions: [string, string, string, string];
  explanation: string;
  examTip?: string;
  difficulty: Difficulty;
  cognitive: Cognitive;
  /**
   * Slug of a figure in `./model-figures.ts`, for questions the student cannot
   * answer from words alone — a logic circuit, a flowchart, a worksheet
   * segment. Unlike the extracted past-paper figures these are drawn by us, so
   * they carry real alt text and a figure question can actually be published.
   */
  figure?: string;
};

export const MODEL_QUESTIONS: QuestionSeed[] = [
  /* ---------------- 1. Place of the computer ---------------- */
  {
    topic: '1.2',
    stem: 'A school office records the marks of every student in a term test. The marks by themselves are **data**. Which of the following is **information** produced from that data?',
    options: [
      'The list of marks exactly as the teachers wrote them',
      'The average mark of the class for each subject',
      'The name of each student in the class',
      'The blank mark sheet before it is filled in',
    ],
    correct: 1,
    misconceptions: [
      'Raw marks written down are still data — nothing has been processed yet.',
      '',
      'A student name is another piece of raw data, not a result of processing.',
      'An empty form contains neither data nor information.',
    ],
    explanation:
      'Data are raw, unprocessed facts. Information is what you get after data has been **processed** so that it means something to someone. Individual marks are data; the class average is produced by processing those marks, so it is information.',
    examTip:
      'Ask yourself "was any processing done?" If nothing was calculated, sorted, summarised or compared, it is still data.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '1.2',
    stem: 'What are the three main components of an information system, in the correct order?',
    options: [
      'Storage → Processing → Output',
      'Input → Processing → Output',
      'Input → Output → Storage',
      'Processing → Input → Output',
    ],
    correct: 1,
    misconceptions: [
      'Storage is a supporting function, not the first stage of the basic model.',
      '',
      'Output cannot come before the data has been processed.',
      'You cannot process data that has not been entered yet.',
    ],
    explanation:
      'The basic system model is **Input → Processing → Output**. Data enters the system, the system processes it, and the result leaves as information. Storage and communication support this cycle but are not part of the three-stage core.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '1.3',
    stem: 'Which technology is associated with the **second** generation of computers?',
    options: ['Vacuum tubes', 'Transistors', 'Integrated circuits', 'Microprocessors'],
    correct: 1,
    misconceptions: [
      'Vacuum tubes belong to the first generation.',
      '',
      'Integrated circuits arrived with the third generation.',
      'Microprocessors define the fourth generation.',
    ],
    explanation:
      'The generations run: 1st — vacuum tubes, 2nd — transistors, 3rd — integrated circuits, 4th — microprocessors (LSI/VLSI), 5th — artificial intelligence and, increasingly, quantum computing. Transistors made computers smaller, faster and far more reliable than valve machines.',
    examTip: 'Remember the order as "Valves, Transistors, ICs, Micro" — each step made the machine smaller.',
    difficulty: 'easy',
    cognitive: 'recall',
  },

  /* ---------------- 2. Hardware ---------------- */
  {
    topic: '2.2',
    stem: 'Which of the following is an **input** device only?',
    options: ['Touch screen', 'Scanner', 'Hard disk', 'Network interface card'],
    correct: 1,
    misconceptions: [
      'A touch screen both displays output and accepts input, so it is both.',
      '',
      'A hard disk is a storage device — it both reads and writes.',
      'A NIC is a communication device that sends and receives.',
    ],
    explanation:
      'A scanner only converts a physical document into digital data going **into** the computer. A touch screen is both input and output; a hard disk stores; a NIC communicates in both directions.',
    examTip:
      'Watch for the word "only". Touch screens and modems are the classic traps because they work in both directions.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '2.3',
    stem: 'Which port would you use to connect a computer to a wired local area network?',
    options: ['HDMI port', 'Ethernet (RJ45) port', 'USB port', 'VGA port'],
    correct: 1,
    misconceptions: [
      'HDMI carries digital video and audio to a display.',
      '',
      'USB can carry a network adapter, but it is not the network port itself.',
      'VGA carries analog video to a monitor or projector.',
    ],
    explanation:
      'The **Ethernet port**, which takes an RJ45 connector, is the dedicated wired networking port. HDMI and VGA are video ports; USB is a general-purpose peripheral port.',
    examTip:
      'Learn the connector name with the port: RJ45 → Ethernet, and RJ11 → telephone line.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '2.4',
    stem: 'Which part of the CPU performs addition, subtraction and comparison?',
    options: [
      'Control Unit (CU)',
      'Arithmetic and Logic Unit (ALU)',
      'Memory registers',
      'Cache memory',
    ],
    correct: 1,
    misconceptions: [
      'The control unit directs and coordinates; it does not calculate.',
      '',
      'Registers hold the values being worked on, but do not operate on them.',
      'Cache stores frequently used data close to the CPU; it does no arithmetic.',
    ],
    explanation:
      'The **ALU** carries out all arithmetic operations (+ − × ÷) and all logical comparisons (=, <, >). The control unit fetches and decodes instructions and tells the ALU what to do; registers hold the operands.',
    examTip:
      'Split the name: **Arithmetic** and **Logic** Unit. If the question involves a sum or a comparison, the answer is the ALU.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '2.5',
    stem: 'Four computers in one room are to be connected in a **star** topology. Which device is required at the centre?',
    options: ['A modem', 'A switch', 'A firewall', 'A repeater'],
    correct: 1,
    misconceptions: [
      'A modem converts between digital and analog signals for a telephone or cable line.',
      '',
      'A firewall filters traffic for security; it does not create the topology.',
      'A repeater regenerates a weakened signal over distance.',
    ],
    explanation:
      'In a star topology every device connects to one central point. A **switch** provides that central connection point and forwards frames only to the intended recipient. A hub would also physically work, but a switch is the modern answer because it does not broadcast to everyone.',
    examTip:
      'Star = one device in the middle. If the question says "connect several computers in one building", think switch.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '2.5',
    stem: 'Which transmission medium is **least** affected by electromagnetic interference?',
    options: ['Twisted pair cable', 'Coaxial cable', 'Fibre optic cable', 'Radio waves'],
    correct: 2,
    misconceptions: [
      'Twisted pair reduces interference by twisting, but is still electrical and still affected.',
      'Coaxial shielding helps, but the signal is still electrical.',
      '',
      'Radio waves are highly vulnerable to interference.',
    ],
    explanation:
      'Fibre optic cable carries **light**, not electricity, so electromagnetic fields cannot disturb the signal. That is also why fibre supports far higher speeds over far longer distances than copper.',
    examTip:
      'Fibre wins on speed, distance and interference. Its usual disadvantage is cost and fragility.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '2.5',
    stem: 'A network connects computers in three branch offices in Colombo, Kandy and Jaffna. What type of network is this?',
    options: ['PAN', 'LAN', 'WAN', 'MAN'],
    correct: 2,
    misconceptions: [
      'A PAN covers a few metres around one person — a phone and its earbuds.',
      'A LAN is limited to one building or site.',
      '',
      'A MAN covers a single city; these offices are in three different cities.',
    ],
    explanation:
      'A **Wide Area Network (WAN)** spans large geographical distances, typically using links leased from a telecommunications provider. Three cities is well beyond LAN or MAN scale.',
    examTip: 'Judge by distance: PAN (metres) → LAN (building) → MAN (city) → WAN (country or wider).',
    difficulty: 'easy',
    cognitive: 'application',
  },

  /* ---------------- 3. Data representation ---------------- */
  {
    topic: '3.3',
    stem: 'What is 45₁₀ expressed in binary?',
    options: ['101011₂', '101101₂', '110101₂', '101110₂'],
    correct: 1,
    misconceptions: [
      'This is 43 — a place value has been dropped.',
      '',
      'This is 53 — the digits have been reversed somewhere.',
      'This is 46 — the last two bits are transposed.',
    ],
    explanation:
      'Divide repeatedly by 2 and read the remainders **upwards**: 45÷2=22 r1, 22÷2=11 r0, 11÷2=5 r1, 5÷2=2 r1, 2÷2=1 r0, 1÷2=0 r1 → 101101₂. Check by place value: 32+8+4+1 = 45. ✓',
    examTip:
      'Always check your answer by adding the place values back up. It takes five seconds and catches almost every slip.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '3.3',
    stem: 'What is 11010110₂ expressed in decimal?',
    options: ['198₁₀', '214₁₀', '206₁₀', '218₁₀'],
    correct: 1,
    misconceptions: [
      'A place value has been missed — check the 16s column.',
      '',
      'The 8s and 16s columns have been confused.',
      'The 4s column has been counted when its bit is 0.',
    ],
    explanation:
      'Write the place values above the bits: 128 64 32 16 8 4 2 1. The bits are 1 1 0 1 0 1 1 0, so add 128 + 64 + 16 + 4 + 2 = 214.',
    examTip:
      'Write the place values 128 64 32 16 8 4 2 1 above the number before you start. Never do it in your head.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '3.3',
    stem: 'What is 2AF₁₆ expressed in decimal?',
    options: ['687₁₀', '559₁₀', '683₁₀', '2015₁₀'],
    correct: 0,
    misconceptions: [
      '',
      'A has been read as 9 instead of 10.',
      'F has been read as 11 instead of 15.',
      'The digits have been treated as decimal rather than base 16.',
    ],
    explanation:
      'In hexadecimal A = 10 and F = 15. The place values are 256, 16 and 1: (2 × 256) + (10 × 16) + (15 × 1) = 512 + 160 + 15 = 687.',
    examTip: 'Memorise A=10 through F=15. Almost every hex mistake in the exam is a mis-read letter.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '3.3',
    stem: 'What is 110110₂ expressed in octal?',
    options: ['54₈', '66₈', '46₈', '36₈'],
    correct: 1,
    misconceptions: [
      'The bits have been grouped from the left instead of the right.',
      '',
      'The two groups have been swapped.',
      'The number has been converted to hexadecimal instead of octal.',
    ],
    explanation:
      'Group the bits in **threes from the right**: 110 110. Each group becomes one octal digit: 110₂ = 6 and 110₂ = 6, giving 66₈. Check: 66₈ = 6×8 + 6 = 54₁₀, and 110110₂ = 32+16+4+2 = 54₁₀. ✓',
    examTip:
      'Octal groups in **3** bits, hexadecimal groups in **4** bits. Always group from the right and pad the left with zeros.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '3.3',
    stem: 'What is 3D₁₆ expressed in binary?',
    options: ['00111101₂', '00110101₂', '01011101₂', '00111011₂'],
    correct: 0,
    misconceptions: [
      '',
      'D has been converted as 0101 (5) instead of 1101 (13).',
      'The 3 has been converted as 0101 instead of 0011.',
      'The last two bits of D are transposed.',
    ],
    explanation:
      'Convert each hex digit into exactly **four** bits: 3 = 0011 and D = 13 = 1101. Join them: 00111101₂. Check: 32+16+8+4+1 = 61, and 3D₁₆ = 3×16 + 13 = 61. ✓',
    examTip:
      'One hex digit is always exactly four bits — never three, never five. Pad with leading zeros.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '3.4',
    stem: 'How many kilobytes are there in 1 gigabyte?',
    options: ['1024 KB', '1024 × 1024 KB', '1024 × 1024 × 1024 KB', '1000 × 1000 KB'],
    correct: 1,
    misconceptions: [
      'That is 1 megabyte, not 1 gigabyte.',
      '',
      'That is 1 terabyte.',
      'The syllabus uses 1024, not 1000, for these units.',
    ],
    explanation:
      'Each step up multiplies by 1024: 1 GB = 1024 MB, and 1 MB = 1024 KB. So 1 GB = 1024 × 1024 KB = 1 048 576 KB.',
    examTip:
      'Count the steps between the two units and multiply by 1024 once per step. KB→GB is two steps.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '3.4',
    stem: 'Which of the following storage types is the **fastest** for the CPU to access?',
    options: ['Solid state drive (SSD)', 'Random access memory (RAM)', 'Cache memory', 'Hard disk drive'],
    correct: 2,
    misconceptions: [
      'An SSD is much faster than a hard disk but far slower than any internal memory.',
      'RAM is fast, but cache sits closer to the CPU and is faster still.',
      '',
      'A hard disk has moving parts and is the slowest option listed.',
    ],
    explanation:
      'The memory hierarchy from fastest to slowest is: registers → cache → RAM → SSD → hard disk. Cache is small, expensive and physically closest to the processor, which is exactly why it is fast.',
    examTip:
      'Speed and capacity move in opposite directions. The fastest storage is always the smallest and most expensive per byte.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '3.5',
    stem: 'Which coding system was designed to represent the characters of **all** the world\'s writing systems, including Sinhala and Tamil?',
    options: ['BCD', 'ASCII', 'Unicode', 'Binary'],
    correct: 2,
    misconceptions: [
      'BCD encodes only the decimal digits 0–9.',
      'Standard ASCII has only 128 codes — enough for English, but not for Sinhala or Tamil.',
      '',
      'Binary is a number system, not a character coding system.',
    ],
    explanation:
      '**Unicode** assigns a unique code to every character in every major writing system, which is why Sinhala (සිංහල) and Tamil (தமிழ்) text can be stored and exchanged. ASCII covers only the basic English character set.',
    examTip:
      'A question that mentions Sinhala, Tamil, or "many languages" is almost always pointing at Unicode.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },

  /* ---------------- 4. Logic gates ---------------- */
  {
    topic: '4.1',
    stem: 'The output of an **AND** gate is 1 when:',
    options: [
      'at least one input is 1',
      'all inputs are 1',
      'all inputs are 0',
      'exactly one input is 1',
    ],
    correct: 1,
    misconceptions: [
      'That describes an OR gate.',
      '',
      'That would make the output 0 for an AND gate.',
      'That describes an XOR gate.',
    ],
    explanation:
      'An AND gate outputs 1 **only** when every input is 1. With two inputs, the only row of the truth table giving 1 is 1 AND 1.',
    examTip:
      'Read AND as "both": both conditions must hold. Read OR as "either": one is enough.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '4.1',
    stem: 'For inputs A = 1 and B = 0, what is the output of a **NOR** gate?',
    options: ['0', '1', 'Depends on a third input', 'Undefined'],
    correct: 0,
    misconceptions: [
      '',
      'The OR result has been given without applying the final NOT.',
      'A NOR gate produces a defined output for the inputs it has.',
      'Every combination of inputs gives a defined output.',
    ],
    explanation:
      'NOR is OR followed by NOT. First A OR B = 1 OR 0 = 1. Then invert it: NOT 1 = **0**. A NOR gate outputs 1 only when *every* input is 0.',
    examTip:
      'For NAND and NOR, always do the basic gate first and invert **last**. Inverting first is the single most common error.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '4.2',
    stem: 'A security alarm must sound when the door sensor is triggered **AND** the system is armed. Which single gate implements this?',
    options: ['OR gate', 'AND gate', 'NOT gate', 'NOR gate'],
    correct: 1,
    misconceptions: [
      'An OR gate would sound the alarm when the system is disarmed, which is wrong.',
      '',
      'A NOT gate has only one input; this problem has two conditions.',
      'A NOR gate would sound the alarm only when nothing at all is happening.',
    ],
    explanation:
      'Two conditions must **both** be true before the alarm sounds, which is exactly the behaviour of an AND gate. Alarm = Sensor AND Armed.',
    examTip:
      'Translate the English straight into gates: "and" → AND, "or" → OR, "not"/"unless" → NOT.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '4.2',
    stem: 'Which pair of gates are known as the **universal** gates, because any other gate can be built from them?',
    options: ['AND and OR', 'NAND and NOR', 'NOT and AND', 'OR and NOT'],
    correct: 1,
    misconceptions: [
      'AND and OR cannot produce inversion, so they cannot build a NOT gate.',
      '',
      'This combination can build other gates, but it is not the standard universal pair.',
      'Same — useful, but not what "universal gates" refers to.',
    ],
    explanation:
      '**NAND** and **NOR** are the universal gates: each on its own can be wired to reproduce AND, OR and NOT, and therefore any logic circuit at all. That is why chip manufacturers can build entire processors from a single gate type.',
    examTip: 'Universal gates are the two with a bar over them — NAND and NOR.',
    difficulty: 'medium',
    cognitive: 'recall',
  },
  {
    topic: '4.1',
    stem: 'A truth table for a logic circuit with **4** inputs has how many rows?',
    options: ['4', '8', '16', '32'],
    correct: 2,
    misconceptions: [
      'That is the number of inputs, not the number of combinations.',
      'That is 2³, which is the answer for three inputs.',
      '',
      'That is 2⁵, which would be five inputs.',
    ],
    explanation:
      'Each input can be 0 or 1, so n inputs give 2ⁿ combinations. With 4 inputs that is 2⁴ = 16 rows.',
    examTip:
      'Rows = 2^(number of inputs). Two inputs → 4 rows, three inputs → 8 rows, four inputs → 16 rows.',
    difficulty: 'easy',
    cognitive: 'application',
  },

  /* ---------------- 5. Operating systems ---------------- */
  {
    topic: '5.1',
    stem: 'An operating system that must respond to input within a strictly guaranteed time — such as one controlling a hospital patient monitor — is called a:',
    options: [
      'Multi-user operating system',
      'Real-time operating system',
      'Single-user operating system',
      'Batch operating system',
    ],
    correct: 1,
    misconceptions: [
      'Multi-user refers to how many people can use it at once, not to timing.',
      '',
      'Single-user refers to the number of users, not to response guarantees.',
      'Batch systems process jobs in groups without any time guarantee.',
    ],
    explanation:
      'A **real-time operating system** guarantees a response within a fixed deadline. Medical monitors, aircraft controls and industrial machinery need this — a late response is as bad as a wrong one.',
    examTip: 'The words "immediately", "guaranteed time" or "critical control" point to real-time.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '5.1',
    stem: 'Which OS utility rearranges scattered pieces of files so that each file is stored in one continuous block?',
    options: ['Formatting', 'Partitioning', 'Defragmentation', 'Compression'],
    correct: 2,
    misconceptions: [
      'Formatting prepares a disk for use and erases what is on it.',
      'Partitioning divides one physical disk into separate logical drives.',
      '',
      'Compression reduces file size; it does not reorganise their placement.',
    ],
    explanation:
      '**Defragmentation** gathers the scattered fragments of each file into one continuous area, so the read head travels less and the disk responds faster. It benefits mechanical hard disks; SSDs have no moving parts and should not be defragmented.',
    examTip:
      'Remember the three disk utilities together: Partition (divide), Format (prepare), Defragment (tidy).',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '5.2',
    stem: 'Which file extension indicates a file that can be opened by spreadsheet software?',
    options: ['.docx', '.xlsx', '.pptx', '.accdb'],
    correct: 1,
    misconceptions: [
      '.docx is a word-processing document.',
      '',
      '.pptx is a presentation.',
      '.accdb is a database file.',
    ],
    explanation:
      'The extension tells the operating system which program handles the file. `.xlsx` is a spreadsheet workbook; `.docx` is a document, `.pptx` a presentation and `.accdb` a database.',
    examTip:
      'Learn the office set together: doc → words, xls → sheets, ppt → slides, accdb/mdb → database.',
    difficulty: 'easy',
    cognitive: 'recall',
  },

  /* ---------------- 6. Word processing ---------------- */
  {
    topic: '6.5',
    stem: 'A student needs to change every occurrence of the word "computor" to "computer" in a 40-page document. Which feature does this fastest and most reliably?',
    options: ['Spelling and grammar check', 'Find and Replace', 'Mail Merge', 'Format Painter'],
    correct: 1,
    misconceptions: [
      'A spell check would find each one but must be confirmed individually.',
      '',
      'Mail merge combines a template with a data source; it does not edit words.',
      'Format Painter copies formatting, not text.',
    ],
    explanation:
      '**Find and Replace** locates every occurrence of a string and substitutes it, either one at a time or all at once — the right tool for a repeated, identical correction.',
    examTip:
      'Match the tool to the job: repeated identical edit → Find and Replace; repeated identical *formatting* → Format Painter.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '6.6',
    stem: 'A school must send the same invitation letter to 300 parents, each addressed by name. Which word-processing feature is designed for this?',
    options: ['Mail Merge', 'Find and Replace', 'Table insertion', 'Page setup'],
    correct: 0,
    misconceptions: [
      '',
      'Find and Replace would have to be run 300 times by hand.',
      'A table organises data in the document; it does not generate letters.',
      'Page setup controls margins and orientation only.',
    ],
    explanation:
      '**Mail Merge** combines a *template document* containing the fixed text with a *data source* containing the varying details, producing one personalised copy per record.',
    examTip:
      'Mail merge always needs two things: the common document and the source data. Exam questions often ask you to name both.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '6.3',
    stem: 'Which alignment makes both the left and right edges of a paragraph straight?',
    options: ['Left align', 'Center align', 'Right align', 'Justify'],
    correct: 3,
    misconceptions: [
      'Left align leaves the right edge ragged.',
      'Center align leaves both edges ragged.',
      'Right align leaves the left edge ragged.',
      '',
    ],
    explanation:
      '**Justify** adjusts the spacing between words so that text meets both margins evenly, which is why newspapers and textbooks use it.',
    difficulty: 'easy',
    cognitive: 'recall',
  },

  /* ---------------- 7. Spreadsheets ---------------- */
  {
    topic: '7.4',
    stem: 'Cells A1 to A5 contain 10, 20, 30, 40 and 50. What does `=AVERAGE(A1:A5)` return?',
    options: ['30', '150', '50', '5'],
    correct: 0,
    misconceptions: [
      '',
      'That is the result of SUM, not AVERAGE.',
      'That is the result of MAX.',
      'That is the result of COUNT.',
    ],
    explanation:
      'AVERAGE adds the values and divides by how many there are: (10+20+30+40+50) ÷ 5 = 150 ÷ 5 = **30**.',
    examTip:
      'Learn the family together: SUM adds, AVERAGE means, MAX largest, MIN smallest, COUNT counts numbers, COUNTA counts non-empty cells.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '7.4',
    stem: 'A range contains: 5, "absent", 12, (empty), 8. What does `COUNT` of that range return?',
    options: ['5', '4', '3', '2'],
    correct: 2,
    misconceptions: [
      'That would count every cell including the empty one.',
      'That is what COUNTA returns — it counts non-empty cells including text.',
      '',
      'This undercounts the numeric values.',
    ],
    explanation:
      '`COUNT` counts only cells containing **numbers**: 5, 12 and 8 — so **3**. `COUNTA` would count all non-empty cells including "absent", giving 4.',
    examTip:
      'COUNT counts numbers. COUNTA counts *anything* that is not empty. The A stands for "all".',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '7.7',
    stem: 'The formula `=B2*$C$1` in cell D2 is copied down to cell D3. What does the formula in D3 become?',
    options: ['=B2*$C$1', '=B3*$C$1', '=B3*$C$2', '=B2*$C$2'],
    correct: 1,
    misconceptions: [
      'B2 is a relative reference and must change when copied.',
      '',
      'The dollar signs lock C1, so it cannot become C2.',
      'Both parts are wrong — B2 should change and $C$1 should not.',
    ],
    explanation:
      '`B2` is a **relative** reference, so copying one row down changes it to `B3`. `$C$1` is an **absolute** reference — the dollar signs lock both the column and the row, so it stays `$C$1`.',
    examTip:
      'A dollar sign freezes whatever comes after it. `$C$1` is fully locked; `C$1` locks only the row; `$C1` locks only the column.',
    difficulty: 'hard',
    cognitive: 'application',
  },
  {
    topic: '7.5',
    stem: 'Cell B2 contains 45. What does `=IF(B2>=50,"Pass","Fail")` display?',
    options: ['Pass', 'Fail', 'TRUE', '45'],
    correct: 1,
    misconceptions: [
      'That would be shown only if the condition were true.',
      '',
      'IF returns the value you specify, not TRUE or FALSE.',
      'IF returns one of its two results, not the tested value.',
    ],
    explanation:
      'The condition `B2>=50` tests 45 >= 50, which is false. An IF function returns its **second** result when the condition is false, so the cell displays **Fail**.',
    examTip:
      'Read IF as three parts: IF(*test*, *what to show if true*, *what to show if false*). Evaluate the test first, then pick the branch.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '7.8',
    stem: 'Which chart type best shows each subject\'s share of a student\'s total marks?',
    options: ['Line chart', 'Pie chart', 'Column chart', 'Scatter chart'],
    correct: 1,
    misconceptions: [
      'A line chart shows change over time.',
      '',
      'A column chart compares sizes well, but does not show shares of a whole.',
      'A scatter chart shows the relationship between two variables.',
    ],
    explanation:
      'A **pie chart** divides one whole into slices, so it is the right choice when the question is "what proportion of the total?". Use a column chart to compare separate values, and a line chart for change over time.',
    examTip:
      'Match chart to question: proportion of a whole → pie; comparison → column/bar; change over time → line.',
    difficulty: 'easy',
    cognitive: 'application',
  },

  /* ---------------- 8. Presentations ---------------- */
  {
    topic: '8.2',
    stem: 'Which feature lets you apply the same background, font and logo to every slide at once?',
    options: ['Slide transition', 'Slide master', 'Custom animation', 'Slide show'],
    correct: 1,
    misconceptions: [
      'A transition is the visual effect between one slide and the next.',
      '',
      'Custom animation controls how objects appear within a slide.',
      'Slide show is the presenting mode, not a design tool.',
    ],
    explanation:
      'The **slide master** holds the design that every slide inherits. Change it once, and the change appears on all slides — which is both faster and more consistent than editing each one.',
    examTip:
      'Distinguish clearly: **transition** = between slides; **animation** = objects within a slide; **master** = design for all slides.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '8.1',
    stem: 'Which of the following is **good** practice when designing presentation slides?',
    options: [
      'Write full paragraphs on each slide so nothing is forgotten',
      'Use short bullet points and let the speaker supply the detail',
      'Use as many different fonts and colours as possible',
      'Read every slide aloud word for word',
    ],
    correct: 1,
    misconceptions: [
      'Dense paragraphs make the audience read instead of listen.',
      '',
      'Too many fonts and colours reduce readability and look unprofessional.',
      'Reading slides aloud makes the presenter redundant.',
    ],
    explanation:
      'Slides support the speaker; they are not the script. Short bullet points keep the audience listening, while the speaker provides the explanation. Consistent fonts and restrained colour keep the slides readable from the back of a room.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },

  /* ---------------- 9. Databases ---------------- */
  {
    topic: '9.1',
    stem: 'In a relational database, a **row** in a table is also called a:',
    options: ['Field', 'Record', 'Table', 'Query'],
    correct: 1,
    misconceptions: [
      'A field is a *column* — one attribute.',
      '',
      'A table is the whole collection of records.',
      'A query is a request for data, not part of the table structure.',
    ],
    explanation:
      'A **record** is one complete row — all the data about a single entity, such as one student. A **field** is one column, such as "Date of birth".',
    examTip:
      'Fix it visually: fields run down (columns), records run across (rows).',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '9.4',
    stem: 'Which key uniquely identifies each record in a table?',
    options: ['Foreign key', 'Primary key', 'Sort key', 'Index key'],
    correct: 1,
    misconceptions: [
      'A foreign key links to the primary key of *another* table.',
      '',
      'A sort key determines display order, not uniqueness.',
      'An index speeds up searching; it need not be unique.',
    ],
    explanation:
      'The **primary key** is the field whose value is different for every record, so it identifies each one unambiguously — a student admission number, for example. It can never be empty and never repeat.',
    examTip:
      'Primary key = unique *inside* this table. Foreign key = points *outside*, to another table\'s primary key.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '9.4',
    stem: 'A Students table and a Marks table need to be related. The Marks table should contain:',
    options: [
      'A copy of every student\'s full details',
      'A foreign key referring to the Students table\'s primary key',
      'A second primary key of its own choosing',
      'No connection at all — the tables stay separate',
    ],
    correct: 1,
    misconceptions: [
      'Copying details creates redundancy, which good database design exists to prevent.',
      '',
      'A table\'s own primary key identifies its records; it does not create a link.',
      'Without a link the two tables cannot be queried together.',
    ],
    explanation:
      'The Marks table holds a **foreign key** — typically the student\'s admission number — pointing at the primary key of the Students table. Each student\'s details are stored once, and the marks refer to them.',
    examTip:
      'The foreign key always lives on the "many" side. A student has many marks, so the key sits in Marks.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '9.1',
    stem: 'Storing a student\'s address in three different tables risks the copies disagreeing. Which database design goal does this violate?',
    options: [
      'Minimising redundancy',
      'Ensuring security',
      'Improving speed',
      'Simplifying the interface',
    ],
    correct: 0,
    misconceptions: [
      '',
      'Security is about who may access the data, not how many copies exist.',
      'Speed is a side effect here, not the principle being broken.',
      'Interface design is unrelated to how data is stored.',
    ],
    explanation:
      'Storing the same fact more than once is **redundancy**, and it leads directly to *inconsistency*: update one copy and forget the others, and the database now holds two different truths. Removing redundancy is the reason relational design exists.',
    examTip:
      'Learn the well-designed-database list: minimum redundancy, accuracy, consistency, integrity, security, validity, simplicity.',
    difficulty: 'medium',
    cognitive: 'analysis',
  },
  {
    topic: '9.7',
    stem: 'Which database object is used to extract only the records that meet a stated condition?',
    options: ['Form', 'Report', 'Query', 'Table'],
    correct: 2,
    misconceptions: [
      'A form is for entering and editing data.',
      'A report presents data for printing.',
      '',
      'A table stores data; it does not filter it.',
    ],
    explanation:
      'A **query** searches the database using criteria and returns only the matching records — for example, all students who scored above 75. Forms input, reports output, tables store, queries select.',
    examTip:
      'Remember the four objects by their job: Table stores, Form enters, Query finds, Report prints.',
    difficulty: 'easy',
    cognitive: 'recall',
  },

  /* ---------------- 10. Programming ---------------- */
  {
    topic: '10.3',
    stem: 'In a flowchart, which shape represents a **decision**?',
    options: ['Rectangle', 'Diamond', 'Parallelogram', 'Oval'],
    correct: 1,
    misconceptions: [
      'A rectangle represents a process or calculation.',
      '',
      'A parallelogram represents input or output.',
      'An oval represents the start or end of the flowchart.',
    ],
    explanation:
      'A **diamond** marks a decision — a question with two exits, usually labelled Yes and No. Rectangles are processes, parallelograms are input/output, and ovals are terminators.',
    examTip:
      'A diamond is the only shape with two exits, because it is the only shape that asks a question.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '10.3',
    stem: 'Which control structure repeats a block of instructions while a condition remains true?',
    options: ['Sequence', 'Selection', 'Repetition', 'Assignment'],
    correct: 2,
    misconceptions: [
      'Sequence means executing steps one after another, once each.',
      'Selection chooses between alternatives; it does not repeat.',
      '',
      'Assignment stores a value in a variable.',
    ],
    explanation:
      'The three control structures are **sequence** (one after another), **selection** (choose a path) and **repetition** (loop while a condition holds). Every algorithm is built from these three.',
    examTip:
      'Learn the three names and one example of each. Almost every algorithm question is testing which of the three applies.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '10.3',
    stem: 'An algorithm reads three numbers and outputs the largest. What is the **input** of this algorithm?',
    options: ['The largest number', 'The three numbers', 'The comparison steps', 'The output message'],
    correct: 1,
    misconceptions: [
      'The largest number is the output — the result the algorithm produces.',
      '',
      'The comparisons are the *process*, not the input.',
      'A message is part of the output.',
    ],
    explanation:
      'Input is what the algorithm is given, process is what it does, output is what it produces. Here the three numbers are the input, comparison is the process, and the largest number is the output.',
    examTip:
      'For any algorithm question, write I-P-O in the margin and fill it in before you start. It prevents most mistakes.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '10.5',
    stem: 'Which type of program translates the **entire** source program into machine code before it is run?',
    options: ['Interpreter', 'Compiler', 'Assembler', 'Editor'],
    correct: 1,
    misconceptions: [
      'An interpreter translates and executes one statement at a time.',
      '',
      'An assembler translates assembly language specifically, not high-level languages.',
      'An editor is used to write source code; it does not translate.',
    ],
    explanation:
      'A **compiler** translates the whole program at once, producing an executable file that can then be run repeatedly without re-translating. An **interpreter** translates and runs one line at a time, which is slower to run but easier to debug.',
    examTip:
      'Compiler = whole program first, then run. Interpreter = line by line as it runs.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },

  /* ---------------- 11. SDLC ---------------- */
  {
    topic: '11.2',
    stem: 'In the system development life cycle, which stage comes **immediately after** requirement analysis?',
    options: ['Testing', 'Design', 'Implementation', 'Maintenance'],
    correct: 1,
    misconceptions: [
      'Testing comes after something has been built.',
      '',
      'Implementation follows design, not analysis.',
      'Maintenance is the final, ongoing stage.',
    ],
    explanation:
      'The order is: identify requirements → analyse → **design** → develop → test → deploy → maintain. Design turns "what the system must do" into "how it will do it" before any code is written.',
    examTip:
      'Remember it as a sentence: find out, plan, build, check, hand over, look after.',
    difficulty: 'medium',
    cognitive: 'recall',
  },
  {
    topic: '11.2',
    stem: 'Which type of testing checks whether the **completed system** meets the customer\'s stated requirements?',
    options: ['Unit testing', 'Integration testing', 'Acceptance testing', 'System testing'],
    correct: 2,
    misconceptions: [
      'Unit testing checks one small component in isolation.',
      'Integration testing checks that components work together.',
      '',
      'System testing checks the whole system technically, but acceptance testing is the customer\'s sign-off.',
    ],
    explanation:
      '**Acceptance testing** is carried out with or by the customer to confirm the delivered system does what was agreed. Unit → integration → system → acceptance moves from the smallest piece to the customer\'s verdict.',
    difficulty: 'hard',
    cognitive: 'understanding',
  },

  /* ---------------- 12. Internet ---------------- */
  {
    topic: '12.1',
    stem: 'What does a Domain Name Server (DNS) do?',
    options: [
      'Stores the web pages of a website',
      'Translates a domain name into an IP address',
      'Connects a computer to the electricity supply',
      'Scans incoming email for viruses',
    ],
    correct: 1,
    misconceptions: [
      'Web pages are stored on a web server, not a DNS server.',
      '',
      'This has nothing to do with networking.',
      'That is the job of anti-virus or mail-filtering software.',
    ],
    explanation:
      'Computers route traffic using **IP addresses**, but people remember **names**. DNS is the directory that translates a name such as `nie.ac.lk` into the numeric address the network actually uses.',
    examTip:
      'Think of DNS as the telephone directory of the internet: you know the name, it gives you the number.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '12.1',
    stem: 'In the URL `https://www.nie.ac.lk/syllabus.html`, which part is the **domain name**?',
    options: ['https', 'www.nie.ac.lk', '/syllabus.html', '.html'],
    correct: 1,
    misconceptions: [
      '`https` is the protocol.',
      '',
      '`/syllabus.html` is the path to a particular file.',
      '`.html` is the file extension.',
    ],
    explanation:
      'A URL has three main parts: the **protocol** (`https`), the **domain name** (`www.nie.ac.lk`) identifying the server, and the **path** (`/syllabus.html`) identifying the resource on it.',
    examTip:
      'Split any URL at the slashes: before the first single slash is the domain, after it is the path.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '12.2',
    stem: 'An email is sent to one main recipient, with a copy to a second person whose address the other recipients must **not** see. Which field is used for the second person?',
    options: ['To', 'Cc', 'Bcc', 'Subject'],
    correct: 2,
    misconceptions: [
      'To is for the main recipients, visible to everyone.',
      'Cc is a visible carbon copy — everyone can see it.',
      '',
      'Subject is the title of the message.',
    ],
    explanation:
      '**Bcc** (blind carbon copy) sends a copy without revealing that address to the other recipients. Cc is visible to all; Bcc is not.',
    examTip: 'The B in Bcc stands for **blind** — the other readers are blind to that address.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '12.3',
    stem: 'A student saves an assignment to a service that lets her open it later from a different computer at school. This is an example of:',
    options: ['Cloud storage', 'Cache memory', 'Local storage', 'Read-only memory'],
    correct: 0,
    misconceptions: [
      '',
      'Cache is high-speed memory inside the computer.',
      'Local storage would keep the file on that one machine only.',
      'ROM holds firmware and cannot be written by a user.',
    ],
    explanation:
      '**Cloud storage** keeps files on remote servers reached over the internet, so they can be opened from any device with a connection. The trade-off is that access depends on the network.',
    difficulty: 'easy',
    cognitive: 'application',
  },

  /* ---------------- 13. Multimedia ---------------- */
  {
    topic: '13.1',
    stem: 'Which statement about a **vector** graphic is correct?',
    options: [
      'It is made of a grid of pixels',
      'It can be enlarged without losing quality',
      'It is always smaller in file size than any raster image',
      'It is the format produced by a digital camera',
    ],
    correct: 1,
    misconceptions: [
      'That describes a raster (bitmap) graphic.',
      '',
      'File size depends on complexity; a detailed vector can be larger than a small photo.',
      'Cameras produce raster images.',
    ],
    explanation:
      'A vector graphic is stored as mathematical descriptions of lines and shapes, so it is **redrawn** at whatever size is needed and stays sharp. A raster image is a fixed grid of pixels and becomes blocky when enlarged.',
    examTip:
      'Logos and diagrams are vector; photographs are raster. If it must scale to a billboard, it is vector.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '13.1',
    stem: 'Which type of compression permanently discards some of the original data to reduce file size?',
    options: ['Lossless compression', 'Lossy compression', 'Encryption', 'Defragmentation'],
    correct: 1,
    misconceptions: [
      'Lossless compression allows the original to be restored exactly.',
      '',
      'Encryption protects data from being read; it does not shrink it.',
      'Defragmentation reorganises files on a disk.',
    ],
    explanation:
      '**Lossy** compression achieves smaller files by throwing away detail the human eye or ear is unlikely to notice — as in JPEG and MP3. The discarded data cannot be recovered. **Lossless** compression, as in PNG, reduces size with no loss at all.',
    examTip: 'JPEG and MP3 are lossy. PNG and ZIP are lossless.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },

  /* ---------------- 14. Web design ---------------- */
  {
    topic: '14.1',
    stem: 'Which HTML tag pair creates the **largest** heading?',
    options: ['`<h6>...</h6>`', '`<h1>...</h1>`', '`<head>...</head>`', '`<big>...</big>`'],
    correct: 1,
    misconceptions: [
      '`<h6>` is the *smallest* heading level.',
      '',
      '`<head>` holds page metadata and is not displayed as a heading.',
      '`<big>` is obsolete and is not a heading tag.',
    ],
    explanation:
      'HTML heading levels run from `<h1>` (largest, most important) to `<h6>` (smallest). Note that `<head>` is a completely different element — it holds the title and metadata, not visible headings.',
    examTip: 'Heading numbers work like importance rankings: h1 is first place, h6 is sixth.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '14.2',
    stem: 'What is the main difference between a **static** and a **dynamic** website?',
    options: [
      'A static site uses images and a dynamic site does not',
      'A static site shows the same content to everyone until it is edited by hand',
      'A dynamic site cannot be viewed on a mobile phone',
      'A static site cannot use HTML',
    ],
    correct: 1,
    misconceptions: [
      'Both kinds of site can use images.',
      '',
      'Both kinds work on mobile devices.',
      'Static sites are built from HTML.',
    ],
    explanation:
      'A **static** page delivers the same stored file to every visitor and changes only when someone edits it. A **dynamic** page is generated when it is requested, often from a database, so it can differ per user or update automatically.',
    examTip:
      'Ask "does the page change by itself?" If it needs a person to edit the file, it is static.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '14.3',
    stem: 'Which is required to make a completed website available on the internet?',
    options: [
      'A web host and a domain name',
      'A printer and a scanner',
      'A spreadsheet and a database',
      'An operating system only',
    ],
    correct: 0,
    misconceptions: [
      '',
      'These are peripherals unrelated to publishing.',
      'These are application software, not publishing requirements.',
      'An OS runs the computer; it does not publish a site.',
    ],
    explanation:
      'To publish, you need **web hosting** — server space with a permanent internet connection — and a **domain name** so visitors can find it. Files are then transferred to the host, commonly using FTP.',
    difficulty: 'easy',
    cognitive: 'recall',
  },

  /* ---------------- 15. ICT and society ---------------- */
  {
    topic: '15.2',
    stem: 'A student sits at a computer for many hours without a break and develops pain in the wrists and neck. This is an example of:',
    options: [
      'A software error',
      'A health issue related to ICT use',
      'A network failure',
      'A data protection breach',
    ],
    correct: 1,
    misconceptions: [
      'No program has malfunctioned.',
      '',
      'The network is not involved.',
      'No personal data has been exposed.',
    ],
    explanation:
      'Prolonged computer use without proper posture or breaks causes repetitive strain injury and eye strain. Correct chair height, screen at eye level and regular breaks are the standard **ergonomic** remedies.',
    examTip:
      'Group the ICT-and-society problems: health, security, privacy, ethical, and environmental (e-waste).',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '15.2',
    stem: 'Someone gains access to a school\'s student database without permission and changes marks. This is best described as:',
    options: ['A hardware fault', 'Computer crime', 'A backup failure', 'Data compression'],
    correct: 1,
    misconceptions: [
      'No equipment has failed.',
      '',
      'Backups are unrelated to unauthorised access.',
      'Compression reduces file size; it does not alter records.',
    ],
    explanation:
      'Unauthorised access to a computer system, and alteration of the data in it, is **computer crime**. Passwords, access rights, encryption and audit logs are the usual defences.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '15.2',
    stem: 'Old computers and phones thrown into general rubbish create which problem?',
    options: [
      'Electronic waste polluting the environment',
      'Slower internet speeds',
      'Software piracy',
      'Loss of network signal',
    ],
    correct: 0,
    misconceptions: [
      '',
      'Discarded hardware does not affect network speed.',
      'Piracy concerns illegal copying of software.',
      'Signal strength is unrelated to disposal.',
    ],
    explanation:
      '**E-waste** contains lead, mercury and cadmium, which leach into soil and water when dumped. Responsible disposal means recycling through authorised collectors so that materials are recovered safely.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  /* ================================================================== *
   * Syllabus gap-fill — one question for each topic that the bank above
   * did not reach. With these, all 60 syllabus topics are covered.
   * ================================================================== */

  /* ---------------- 1. Place of the computer ---------------- */
  {
    topic: '1.1',
    stem: 'A farmer checks the current wholesale price of vegetables on a government website before deciding where to sell. Which contribution of ICT to national development does this illustrate?',
    options: [
      'Reducing the cost of manufacturing farm machinery',
      'Giving producers access to market information they could not otherwise get quickly',
      'Replacing agricultural workers with robots',
      'Storing the farmer\'s personal records for the government',
    ],
    correct: 1,
    misconceptions: [
      'Nothing here concerns manufacturing — no machine is being built or made cheaper.',
      '',
      'No labour is being replaced; the farmer still does the same work, better informed.',
      'The benefit flows to the farmer as information, not to the state as record-keeping.',
    ],
    explanation:
      'ICT contributes to development largely by **removing information gaps**. A farmer who knows today\'s prices in several markets can choose the best one and is far less dependent on a middleman\'s word. The same pattern — timely information reaching the person who needs it — appears in e-government, telemedicine and distance education.',
    examTip:
      'When a question describes ICT "helping" a sector, ask what information moved and who it reached. That is usually the answer.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },

  /* ---------------- 2. Hardware ---------------- */
  {
    topic: '2.1',
    stem: 'A national weather centre must process readings streaming continuously from many satellites to forecast the monsoon. Which type of computer is most suitable?',
    options: ['Supercomputer', 'Laptop computer', 'Tablet computer', 'Embedded computer'],
    correct: 0,
    misconceptions: [
      '',
      'A laptop is built for one person\'s portable general-purpose work, not for sustained heavy computation.',
      'A tablet is designed for light, touch-based consumption of content.',
      'An embedded computer is fixed inside a device to do one dedicated job, like control a washing machine.',
    ],
    explanation:
      'Computers are classified by **processing power and purpose**. A supercomputer performs an enormous number of calculations per second and is used exactly for problems like weather modelling, climate simulation and nuclear research. Note the giveaway in the question: a very large volume of data arriving continuously.',
    examTip:
      'Match the scale in the question to the class: one person → laptop/desktop; one dedicated task inside a machine → embedded; whole organisation → mainframe/server; national-scale calculation → supercomputer.',
    difficulty: 'easy',
    cognitive: 'application',
  },

  /* ---------------- 3. Data representation ---------------- */
  {
    topic: '3.1',
    stem: 'Why is the **binary** number system used to represent data inside a computer?',
    options: [
      'Because binary numbers are shorter than decimal numbers',
      'Because electronic components reliably hold two states, such as on and off',
      'Because binary arithmetic is more accurate than decimal arithmetic',
      'Because humans find binary easier to read than decimal',
    ],
    correct: 1,
    misconceptions: [
      'The opposite is true — a binary number needs far more digits than the same value in decimal.',
      '',
      'The arithmetic gives the same results; the number system does not change the value.',
      'Binary is much harder for people to read, which is why we also use octal and hexadecimal.',
    ],
    explanation:
      'A binary digit maps directly onto a **physical two-state condition**: a switch on or off, a voltage high or low, a region of a disk magnetised one way or the other. Two states can be told apart reliably even when components are imperfect, whereas distinguishing ten separate voltage levels would be fragile and expensive.',
    examTip:
      'The reason is always about hardware reliability, never about convenience for people or for maths.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '3.2',
    stem: 'Which of the following is **not** a valid number in the octal number system?',
    options: ['17', '70', '48', '365'],
    correct: 2,
    misconceptions: [
      'Both digits 1 and 7 are below 8, so 17 is a valid octal number.',
      'Both 7 and 0 are below 8, so 70 is valid octal.',
      '',
      'The digits 3, 6 and 5 are all below 8, so 365 is valid octal.',
    ],
    explanation:
      'A number system with base *b* uses only the digits **0 to b − 1**. Octal is base 8, so its digits run 0–7 and the digit 8 can never appear. By the same rule binary uses only 0 and 1, and hexadecimal extends past 9 with A–F to reach sixteen symbols.',
    examTip:
      'To spot an invalid number, find its largest digit. If that digit is greater than or equal to the base, the number is impossible in that base.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },

  /* ---------------- 6. Word processing ---------------- */
  {
    topic: '6.1',
    stem: 'Which task is a word processing software designed for?',
    options: [
      'Performing automatic recalculation across a grid of numeric cells',
      'Producing and editing text documents such as letters and reports',
      'Storing related records in tables that can be queried',
      'Editing the individual frames of a video clip',
    ],
    correct: 1,
    misconceptions: [
      'Automatic recalculation across a grid describes spreadsheet software.',
      '',
      'Storing and querying records in tables describes database management software.',
      'Frame-by-frame editing describes video editing software.',
    ],
    explanation:
      'Each kind of application software has a job it is built for. A **word processor** creates, edits, formats and prints text documents; the other three describe a spreadsheet, a DBMS and a video editor. Recognising the intent behind each package is worth easy marks.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '6.2',
    stem: 'You have typed a paragraph and want to move it to the end of the document. Which pair of operations does this **most efficiently**?',
    options: ['Copy and Paste', 'Cut and Paste', 'Find and Replace', 'Undo and Redo'],
    correct: 1,
    misconceptions: [
      'Copy leaves the original in place, so you would end up with the paragraph twice.',
      '',
      'Find and Replace substitutes matching text; it does not relocate a block.',
      'Undo and Redo step backwards and forwards through your edits.',
    ],
    explanation:
      '**Cut** removes the selected text and places it on the clipboard; **Paste** inserts it at the cursor. Together they *move* text. Copy and Paste would *duplicate* it — the distinction between moving and duplicating is the point of the question.',
    examTip:
      'Read for the verb. "Move" means Cut; "duplicate" or "repeat" means Copy.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '6.4',
    stem: 'While typing in the **last cell** of the bottom row of a table in a word processor, you press the Tab key. What happens?',
    options: [
      'The cursor moves back to the first cell of the table',
      'A new row is added to the bottom of the table',
      'The table is deleted',
      'The text in the cell is indented and the cursor stays put',
    ],
    correct: 1,
    misconceptions: [
      'Tab moves forward through cells; it does not wrap around to the start of the table.',
      '',
      'Tab never deletes a table — no editing command destroys structure without confirmation.',
      'Inside a table Tab navigates between cells rather than inserting an indent.',
    ],
    explanation:
      'Inside a table the **Tab key moves to the next cell**, and from the final cell it creates a new row and puts the cursor in its first cell. This is the quickest way to keep typing a growing table without reaching for the mouse. (Ctrl+Tab inserts an actual tab character inside a cell.)',
    difficulty: 'medium',
    cognitive: 'understanding',
  },

  /* ---------------- 7. Spreadsheets ---------------- */
  {
    topic: '7.1',
    stem: 'What is the main advantage of using a spreadsheet rather than a calculator for a set of related calculations?',
    options: [
      'A spreadsheet can hold more digits in a single number',
      'When an input value is changed, every dependent result recalculates automatically',
      'A spreadsheet does not need electricity to run',
      'Spreadsheet formulas cannot contain mistakes',
    ],
    correct: 1,
    misconceptions: [
      'Precision is not the point, and a calculator handles ordinary numbers perfectly well.',
      '',
      'A spreadsheet runs on a computer and certainly needs power.',
      'A formula is written by a person and can be as wrong as any other instruction.',
    ],
    explanation:
      'A spreadsheet stores **formulas, not just answers**. Because each formula refers to cells rather than to fixed numbers, changing one input makes every result that depends on it update at once. That is what makes "what if" work — adjusting a price and instantly seeing the effect on a whole budget.',
    examTip:
      'The word to look for is *automatic recalculation*. It is the defining feature of a spreadsheet.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '7.2',
    stem: 'In a worksheet, which key combination moves the cursor directly to cell A1 from anywhere in the sheet?',
    options: ['Ctrl + Home', 'Home', 'Ctrl + A', 'Page Up'],
    correct: 0,
    misconceptions: [
      '',
      'Home on its own moves to the first column of the current row, not to cell A1.',
      'Ctrl + A selects the whole worksheet rather than moving the cursor.',
      'Page Up scrolls one screen upwards and stops at the top of the sheet.',
    ],
    explanation:
      '**Ctrl + Home** jumps to the top-left cell, A1, from any position. It pairs with Ctrl + End, which jumps to the last cell containing data. Both are worth knowing because scrolling through a large sheet by hand wastes exam time.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '7.3',
    stem: 'Cell A1 contains 10, cell A2 contains 4 and cell A3 contains 2. What value does the formula `=A1-A2*A3` display?',
    options: ['2', '12', '8', '16'],
    correct: 0,
    misconceptions: [
      '',
      'This subtracts first and then multiplies: (10 − 4) × 2. Multiplication must come first.',
      'This ignores A3 entirely and evaluates only 10 − 4.',
      'This adds instead of subtracting: 10 + 4 × 2.',
    ],
    explanation:
      'A spreadsheet follows the ordinary **order of operations**: brackets, then powers, then multiplication and division, then addition and subtraction. So A2\\*A3 is evaluated first, giving 4 × 2 = 8, and then 10 − 8 = **2**. Writing `=(A1-A2)*A3` instead would give 12.',
    examTip:
      'If a formula mixes − with \\* or /, do the multiplication or division first unless brackets say otherwise.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '7.6',
    stem: 'A column of numbers displays as `#####` instead of the values. What is the cause?',
    options: [
      'The formulas in the column contain an error',
      'The column is too narrow to display the formatted numbers',
      'The cells have been protected against editing',
      'The numbers exceed the largest value a spreadsheet can hold',
    ],
    correct: 1,
    misconceptions: [
      'A formula error shows a named error value such as #DIV/0! or #NAME?, not a row of hashes.',
      '',
      'Protection prevents changes to a cell; it does not alter how the value is displayed.',
      'A value too large for the program would produce a numeric overflow error, not hashes.',
    ],
    explanation:
      'A run of hash marks is the spreadsheet saying "the formatted number does not fit". Widening the column — or reducing the number of decimal places — brings the value back. The underlying data is untouched, which is why this is a **formatting** problem and not a data problem.',
    examTip:
      'Hashes mean width. Anything beginning with # and a word, like #VALUE!, means a real error.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },

  /* ---------------- 9. Databases ---------------- */
  {
    topic: '9.2',
    stem: 'A school wants a single table to record each student\'s admission number, name, date of birth and class. Which of these is the most suitable **primary key**?',
    options: ['Name', 'Date of birth', 'Admission number', 'Class'],
    correct: 2,
    misconceptions: [
      'Two students can share a name, so a name cannot identify a record uniquely.',
      'Many students in a school share a birthday.',
      '',
      'A class contains many students, so it identifies a group rather than an individual.',
    ],
    explanation:
      'A primary key must be **unique for every record and never empty**. An admission number is issued once per student and never reused, which is exactly what the rule demands. Name, date of birth and class can all repeat, so none of them can identify one student reliably.',
    examTip:
      'Test a candidate key by asking "could two different records ever share this value?" If yes, it cannot be the primary key.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '9.3',
    stem: 'A library keeps its records in a paper register. Which of these is a genuine benefit of converting them to an electronic database?',
    options: [
      'The records can never be lost or damaged',
      'A particular record can be found by searching instead of by reading through pages',
      'No staff member will need any training',
      'The library will no longer need any storage space at all',
    ],
    correct: 1,
    misconceptions: [
      'Electronic records can be lost to disk failure, deletion or corruption — which is why backups matter.',
      '',
      'Moving to a new system almost always requires training; that is one of its real costs.',
      'The data still occupies storage, and the library still holds its books.',
    ],
    explanation:
      'The honest gains of computerising records are **fast searching, easy updating, compact storage and simple sharing**. The overstated claims in the wrong options — perfect safety, no training, no space — are the ones examiners use as distractors, because a computerised system trades one set of problems for another rather than removing them.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '9.5',
    stem: 'What does a Database Management System (DBMS) provide that a set of separate files does not?',
    options: [
      'A way to store data on a hard disk',
      'Controlled, consistent access to shared data for many users and applications',
      'A guarantee that the data entered is always correct',
      'Faster hardware for the computer',
    ],
    correct: 1,
    misconceptions: [
      'Ordinary files already store data on a disk; that is not what a DBMS adds.',
      '',
      'A DBMS enforces rules about the *form* of data, but it cannot know whether a fact is true.',
      'Software does not change the machine\'s hardware.',
    ],
    explanation:
      'A DBMS sits between the data and everyone who uses it, and provides **controlled access, consistency, reduced redundancy, security and recovery**. Separate files leave every program to manage those concerns for itself, which is how the same fact ends up stored differently in two places.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '9.6',
    stem: 'What is the main purpose of a **form** in a database?',
    options: [
      'To provide a convenient screen for entering and viewing one record at a time',
      'To print a summary of the data for distribution',
      'To define the fields and data types of a table',
      'To join two tables using a common field',
    ],
    correct: 0,
    misconceptions: [
      '',
      'Printing a summary for distribution is what a report is for.',
      'Defining fields and data types is done in table design, not in a form.',
      'Joining tables on a common field is done in a query.',
    ],
    explanation:
      'The four database objects divide the work cleanly: a **table** stores, a **form** provides a friendly interface for entering and viewing records, a **query** selects and combines, and a **report** formats results for printing. A form matters because it lets a clerk work one record at a time without seeing the raw table.',
    examTip:
      'Remember the four objects as store / enter / select / print — table, form, query, report.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '9.8',
    stem: 'A principal needs a printed list of all Grade 11 students, grouped by class and with a count for each class. Which database object produces this?',
    options: ['A form', 'A report', 'A table', 'A macro'],
    correct: 1,
    misconceptions: [
      'A form is for on-screen entry and viewing of records, not for formatted printing.',
      '',
      'A table holds the raw records but cannot group them or produce subtotals for printing.',
      'A macro automates a sequence of actions; it does not itself lay out printed output.',
    ],
    explanation:
      'A **report** takes the results of a table or query and lays them out for printing, with grouping, sorting, headers and totals. The give-away words here are *printed*, *grouped* and *count for each* — grouping with summary values is precisely what reports do and what forms cannot.',
    difficulty: 'easy',
    cognitive: 'application',
  },

  /* ---------------- 10. Programming ---------------- */
  {
    topic: '10.1',
    stem: 'Before writing an algorithm to calculate a student\'s average mark, what should be identified first?',
    options: [
      'The programming language to be used',
      'The required inputs, the process, and the expected output',
      'The colours of the user interface',
      'The type of computer the program will run on',
    ],
    correct: 1,
    misconceptions: [
      'The language is chosen after the problem is understood, and the same algorithm can be written in many languages.',
      '',
      'Interface appearance is a later design detail, not part of defining the problem.',
      'A well-defined algorithm does not depend on the make of machine.',
    ],
    explanation:
      'Analysing a problem means stating it in terms of **input, process and output** — here the marks are the input, averaging is the process, and the average is the output. Only once that is settled does it make sense to design the algorithm, and only then to choose a language.',
    examTip:
      'Every problem-analysis question comes back to input → process → output. Name all three.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '10.2',
    stem: 'Which of the following is a required property of an algorithm?',
    options: [
      'It must be written in a programming language',
      'It must terminate after a finite number of steps',
      'It must contain at least one loop',
      'It must produce a numeric result',
    ],
    correct: 1,
    misconceptions: [
      'An algorithm can be written in plain language, as pseudocode or as a flowchart.',
      '',
      'Many correct algorithms are a straight sequence with no repetition at all.',
      'An algorithm may output text, a decision, or nothing visible at all.',
    ],
    explanation:
      'An algorithm is a finite, ordered, unambiguous set of steps that solves a problem. **Finiteness** is essential: a procedure that never ends has not solved anything. The other properties — clear steps, defined inputs and outputs, and generality — matter too, but a loop and a numeric answer are not required.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '10.4',
    stem: 'In a Pascal program, which of the following is a **valid** variable name?',
    options: ['2total', 'total marks', 'total_marks', 'begin'],
    correct: 2,
    misconceptions: [
      'A variable name cannot start with a digit.',
      'A variable name cannot contain a space.',
      '',
      '`begin` is a reserved word of the language and cannot be reused as a name.',
    ],
    explanation:
      'A Pascal identifier must **start with a letter or underscore, contain only letters, digits and underscores, and must not be a reserved word**. `total_marks` satisfies all three. Note that Pascal is not case-sensitive, so `Total_Marks` would name the same variable.',
    examTip:
      'Check three things in order: does it start with a digit, does it contain a space or symbol, is it a keyword?',
    difficulty: 'easy',
    cognitive: 'understanding',
  },

  /* ---------------- 11. Information systems ---------------- */
  {
    topic: '11.1',
    stem: 'Which of the following best describes an **information system**?',
    options: [
      'The computer hardware installed in an organisation',
      'People, procedures, data, software and hardware working together to produce useful information',
      'A software package bought from a supplier',
      'The network cabling that connects an organisation\'s computers',
    ],
    correct: 1,
    misconceptions: [
      'Hardware is only one component; a system of machines with no people or procedures produces nothing.',
      '',
      'A software package is a single component, not the whole system.',
      'Cabling is part of the hardware and communication infrastructure.',
    ],
    explanation:
      'An information system is deliberately defined to include **people and procedures** alongside hardware, software and data. That is why installing new software rarely fixes an organisation on its own: if the procedures around it and the people using it do not change, the system as a whole has not changed.',
    examTip:
      'If an option lists only technology, it is probably too narrow. The definition always includes people.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },

  /* ---------------- 13. Multimedia ---------------- */
  {
    topic: '13.2',
    stem: 'In two-dimensional animation software, what is a **key frame**?',
    options: [
      'A frame that defines the start or end point of a change in the animation',
      'The first frame of the whole animation only',
      'A frame that cannot be edited once it is created',
      'A frame that stores the sound track of the animation',
    ],
    correct: 0,
    misconceptions: [
      '',
      'Key frames occur throughout an animation wherever something changes, not only at the very start.',
      'Key frames are edited freely; that is the point of using them.',
      'Sound is placed on its own layer or track, not inside a key frame.',
    ],
    explanation:
      'A key frame marks a **defined state** — a position, size or colour — at a particular point in time. The software then generates the in-between frames automatically, a process called *tweening*. Animating therefore means setting a few key frames rather than drawing every frame by hand.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '13.3',
    stem: 'Which of the following pairs of characteristics both **increase** the file size of a digital audio recording?',
    options: [
      'Lower sampling rate and fewer channels',
      'Higher sampling rate and higher bit depth',
      'Shorter duration and lower bit depth',
      'Mono recording and a lower sampling rate',
    ],
    correct: 1,
    misconceptions: [
      'Both of these reduce the amount of data stored and therefore shrink the file.',
      '',
      'A shorter recording and a lower bit depth both make the file smaller.',
      'Mono uses one channel instead of two, and a lower sampling rate stores fewer samples.',
    ],
    explanation:
      'Digital audio size grows with **sampling rate** (how many times per second the sound is measured), **bit depth** (how precisely each sample is stored), **number of channels** and **duration**. Raising the first two captures more detail per second, so quality and file size rise together — the same trade-off as resolution in images.',
    examTip:
      'More measurements, more precision, more channels or more time all mean a bigger file. Quality costs bytes.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '13.4',
    stem: 'When editing a video clip, what does **trimming** mean?',
    options: [
      'Reducing the resolution of the video',
      'Removing unwanted portions from the beginning or end of the clip',
      'Adding a transition between two clips',
      'Converting the video to a different file format',
    ],
    correct: 1,
    misconceptions: [
      'Changing resolution alters the frame size, which is resizing rather than trimming.',
      '',
      'Adding an effect between two clips is applying a transition.',
      'Changing the file format is converting or exporting.',
    ],
    explanation:
      'Trimming cuts away material from the **start or end** of a clip so that only the wanted section remains — the first step in almost any edit. Splitting divides a clip in two, transitions join clips, and rendering or exporting produces the finished file.',
    difficulty: 'easy',
    cognitive: 'recall',
  },

  /* ---------------- 15. ICT and society ---------------- */
  {
    topic: '15.1',
    stem: 'A patient in a rural hospital is examined by a specialist in Colombo over a live video link. What is this application of ICT called?',
    options: ['E-commerce', 'Telemedicine', 'E-learning', 'Teleconferencing'],
    correct: 1,
    misconceptions: [
      'E-commerce is buying and selling goods or services electronically.',
      '',
      'E-learning delivers teaching and training rather than medical care.',
      'Teleconferencing is the general technology used here; the named application is more specific.',
    ],
    explanation:
      '**Telemedicine** is the delivery of health care at a distance using ICT — remote consultation, diagnosis and monitoring. It matters most exactly where this question places it: a patient far from the specialist they need. Teleconferencing is the underlying tool, but the application has its own name.',
    examTip:
      'When two options are both technically true, choose the one that names the *application* rather than the technology.',
    difficulty: 'easy',
    cognitive: 'application',
  },

  /* ================================================================
   * FIGURE QUESTIONS
   *
   * Each of these is unanswerable from its words alone, which is the
   * point: roughly a quarter of every real Paper I is a picture
   * question, and a bank without them trains a student for an exam
   * they are not going to sit. The figures are drawn by
   * tools/model-figures/build.py and carry real alt text, so they are
   * answerable by a student using a screen reader too.
   * ================================================================ */

  /* ---------------- 4.1 logic circuits ---------------- */
  {
    topic: '4.1',
    figure: 'logic-and-or-not',
    stem: 'In the given logic circuit, what is the output **Q** when A = 1, B = 0 and C = 1?',
    options: ['0', '1', 'Q depends on the order the gates are read in', 'The circuit has no output for these inputs'],
    correct: 0,
    misconceptions: [
      '',
      'This is the answer you get if you take NOT C as 1 — but C is 1, so NOT C is 0.',
      'A combinational circuit gives one output for one set of inputs. There is no ordering to choose.',
      'Every combination of inputs produces an output; there is no undefined state in a combinational circuit.',
    ],
    explanation:
      'Work the gates in order. The AND gate gets A = 1 and B = 0, and an AND gate outputs 1 **only** when every input is 1, so it gives **0**. The NOT gate gets C = 1 and inverts it to **0**. The OR gate therefore receives 0 and 0, and an OR gate outputs 1 when *at least one* input is 1 — neither is — so **Q = 0**.',
    examTip:
      'Write the value on each wire as you go, starting from the inputs. Trying to hold three gates in your head is where marks are lost.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '4.1',
    figure: 'logic-and-or-not',
    stem: 'Which Boolean expression represents the output **Q** of the given logic circuit?',
    options: ['Q = A.B + C', 'Q = A.B + C̄', 'Q = (A + B).C̄', 'Q = A.B.C̄'],
    correct: 1,
    misconceptions: [
      'C passes through a NOT gate before it reaches the OR gate, so the expression needs C̄, not C.',
      '',
      'A and B meet at an AND gate, not an OR gate, so that part is A.B and not (A + B).',
      'The two branches meet at an OR gate, which is written with +, not with a dot.',
    ],
    explanation:
      'Read the circuit from the inputs forward. A and B enter an AND gate, giving **A.B**. C enters a NOT gate, giving **C̄**. Those two results are the inputs of an OR gate, and OR is written as **+**. So Q = A.B + C̄.',
    examTip:
      'In Boolean notation a dot is AND, a plus is OR, and a bar over a letter is NOT. Name the gate first, then write its symbol.',
    difficulty: 'medium',
    cognitive: 'analysis',
  },
  {
    topic: '4.1',
    figure: 'logic-or-and-notb',
    stem: 'For which of the following input combinations does the given logic circuit produce **Q = 1**?',
    options: ['A = 0, B = 0', 'A = 0, B = 1', 'A = 1, B = 0', 'A = 1, B = 1'],
    correct: 2,
    misconceptions: [
      'The OR gate gives 0 when both inputs are 0, so the AND gate receives a 0 and Q is 0.',
      'B = 1 makes NOT B equal to 0, and an AND gate with any 0 input gives 0.',
      '',
      'B = 1 again makes NOT B equal to 0, so the AND gate outputs 0 whatever the OR gate did.',
    ],
    explanation:
      'Q is the AND of two things, so **both** must be 1. The OR gate gives 1 whenever A or B is 1. The NOT gate gives 1 only when B is **0**. Both conditions hold only when B = 0 and A = 1: the OR gate gives 1, NOT B gives 1, and the AND gate gives **Q = 1**.',
    examTip:
      'When one input branches to two gates, that input is doing two jobs at once. Fix its value first and both branches fall out.',
    difficulty: 'hard',
    cognitive: 'analysis',
  },
  {
    topic: '4.1',
    figure: 'truth-table-nand',
    stem: 'Which single logic gate has the truth table shown?',
    options: ['AND gate', 'OR gate', 'NAND gate', 'NOR gate'],
    correct: 2,
    misconceptions: [
      'An AND gate gives 1 only on the last row. This table is the exact opposite of that.',
      'An OR gate gives 0 only on the first row. Here the first row is 1.',
      '',
      'A NOR gate gives 1 only when both inputs are 0. Here three of the four rows give 1.',
    ],
    explanation:
      'The output is 0 on exactly one row — when A and B are both 1 — and 1 everywhere else. That is an AND gate with its output inverted, which is a **NAND** gate.',
    examTip:
      'Count the 1s in the output column first. One 1 means AND or NOR; three 1s means OR or NAND. Then check which row is the odd one out.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '4.1',
    figure: 'logic-nand-not',
    stem: 'The given circuit sends A and B through a NAND gate and then through a NOT gate. Which **single** gate does the whole circuit behave like?',
    options: ['AND gate', 'OR gate', 'NOR gate', 'XOR gate'],
    correct: 0,
    misconceptions: [
      '',
      'An OR gate outputs 1 when either input is 1. This circuit outputs 1 only when both are 1.',
      'A NOR gate would need the OR output inverted, and there is no OR gate in this circuit.',
      'An XOR gate outputs 1 when the inputs *differ*. Here identical 1s give 1.',
    ],
    explanation:
      'A NAND gate is an AND gate with its output inverted. Passing that output through a NOT gate inverts it a second time, and two inversions cancel: NOT(NOT(A.B)) = **A.B**. The circuit is an **AND** gate built the long way round.',
    examTip:
      'Two NOTs in a row always cancel. Spotting that turns a two-gate circuit into a one-gate answer instantly.',
    difficulty: 'medium',
    cognitive: 'analysis',
  },

  /* ---------------- 10.2 / 10.3 flowcharts ---------------- */
  {
    topic: '10.3',
    figure: 'flowchart-sum-to-n',
    stem: 'What is the output **S** of the given flowchart when the input **N** is 4?',
    options: ['4', '10', '15', '24'],
    correct: 1,
    misconceptions: [
      'This is the value of N itself, not the total that was accumulated.',
      '',
      'This is 1 + 2 + 3 + 4 + 5 — the loop stops once I is greater than N, so 5 is never added.',
      'This is 1 × 2 × 3 × 4. The process box adds I to S; it does not multiply.',
    ],
    explanation:
      'Trace it. S starts at 0 and I at 1. Each pass adds I to S then increases I by 1, and the loop stops when I is greater than N. So S becomes 1, then 1 + 2 = 3, then 3 + 3 = 6, then 6 + 4 = **10**. At that point I is 5, which is greater than 4, so the loop ends and 10 is output.',
    examTip:
      'Draw a small table with one column per variable and one row per pass. Tracing in your head is the single most common way to lose this mark.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '10.2',
    figure: 'flowchart-sum-to-n',
    stem: 'Which control structure is used by the given flowchart?',
    options: ['Sequence only', 'Selection only', 'Repetition', 'No control structure is used'],
    correct: 2,
    misconceptions: [
      'A sequence runs each step once, top to bottom. Here the flow goes back up to an earlier step.',
      'A decision box is present, but its No branch loops back rather than simply choosing between two paths.',
      '',
      'Every algorithm uses at least one control structure; a flowchart with a loop in it uses repetition.',
    ],
    explanation:
      'The No branch of the decision goes **back** to a step the flow has already passed, so a group of steps runs over and over until the condition becomes true. Steps that repeat until a condition is satisfied are **repetition** (also called iteration or looping).',
    examTip:
      'Look for an arrow that travels upwards. Selection fans out and rejoins; repetition goes back.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },

  /* ---------------- 2.4 / 2.5 hardware and networks ---------------- */
  {
    topic: '2.4',
    figure: 'block-diagram-cpu',
    stem: 'In the given block diagram of a computer, the boxes **A**, **B** and **C** are, in order:',
    options: [
      'A = Control Unit, B = ALU, C = Main memory',
      'A = Main memory, B = ALU, C = Control Unit',
      'A = ALU, B = Main memory, C = Control Unit',
      'A = Control Unit, B = Main memory, C = ALU',
    ],
    correct: 0,
    misconceptions: [
      '',
      'Main memory is drawn outside the CPU block, so it cannot be A or B.',
      'Main memory sits outside the CPU, so it cannot be one of the two boxes inside it.',
      'The ALU is part of the CPU and is drawn inside it, so it cannot be C.',
    ],
    explanation:
      'A and B are both **inside** the CPU block, and the two units inside a CPU are the **Control Unit** and the **Arithmetic and Logic Unit**. C is drawn outside the CPU but connected to it in both directions, which is **main memory**. Input feeds the CPU, and the CPU sends results to output.',
    examTip:
      'Whether a box is inside or outside the CPU rectangle is the whole question. Memory is always outside it in this diagram.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '2.5',
    figure: 'topology-star',
    stem: 'Which network topology is shown in the given diagram?',
    options: ['Bus topology', 'Ring topology', 'Star topology', 'Mesh topology'],
    correct: 2,
    misconceptions: [
      'A bus topology has all computers tapped onto one shared backbone cable, not radiating from a device.',
      'In a ring, each computer joins two neighbours and the cabling forms a closed loop.',
      '',
      'In a mesh, every computer connects directly to every other computer, with no central device.',
    ],
    explanation:
      'Every computer has its own separate cable running to one central device, and no computer is cabled directly to another. That is a **star topology**, the most commonly used design.',
    examTip:
      'Count the cables at the busiest point. A star has one central device carrying every connection.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '2.5',
    figure: 'topology-bus',
    stem: 'The diagram shows a bus topology. What happens if the **backbone cable** breaks in the middle?',
    options: [
      'Only the computer nearest the break is affected',
      'The network is disrupted for the computers on either side of the break',
      'Nothing changes, because data can take another route',
      'The computers automatically reconnect through a switch',
    ],
    correct: 1,
    misconceptions: [
      'The break is in the shared cable, not in one computer’s own drop cable, so more than one machine is affected.',
      '',
      'A bus has only one path between any two computers. There is no alternative route to take.',
      'There is no switch in a bus topology, and a broken cable does not repair itself.',
    ],
    explanation:
      'In a bus topology every computer shares **one** cable, which is why it is called the backbone. A break in it splits the network in two, and computers on opposite sides of the break can no longer reach each other. This single point of failure is the main weakness of the design.',
    examTip:
      'Ask "how many paths are there between two computers?" A bus and a ring have one; a mesh has many.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '2.5',
    figure: 'topology-ring',
    stem: 'The diagram shows a ring topology. How many cables is **each** computer directly connected to?',
    options: ['One', 'Two', 'Four', 'One for every other computer in the ring'],
    correct: 1,
    misconceptions: [
      'One cable each would give a star, where every machine runs a single line to a central device.',
      '',
      'Nothing in the diagram connects a computer to four others; that would be closer to a mesh.',
      'Connecting to every other computer is a mesh topology, not a ring.',
    ],
    explanation:
      'In a ring each computer is joined to exactly **two** neighbours, one on each side, so the cabling closes into an unbroken loop and data travels around it in a circle. It is also why a single break in the ring can bring down the whole network.',
    examTip:
      'A ring looks like a circle of computers with no device in the middle. If there is a hub or switch in the middle, it is a star.',
    difficulty: 'easy',
    cognitive: 'recall',
  },

  /* ---------------- 7.x spreadsheets ---------------- */
  {
    topic: '7.3',
    figure: 'sheet-qty-price',
    stem: 'In the given worksheet, which formula should be entered in cell **D2** to calculate the total value of the pens?',
    options: ['=B2+C2', '=B2*C2', '=SUM(B2:C2)', '=B2*C2*D2'],
    correct: 1,
    misconceptions: [
      'Adding a quantity to a price gives a number that means nothing. A total value needs multiplication.',
      '',
      'SUM adds the cells in the range, so this is the same mistake as =B2+C2 written a longer way.',
      'D2 is the cell the formula is being written into. A formula that refers to its own cell is a circular reference.',
    ],
    explanation:
      'Total value is quantity **times** price. The quantity is in B2 and the price is in C2, so the formula is **=B2*C2**, which gives 12 × 25 = 300. Every spreadsheet formula begins with an equals sign.',
    examTip:
      'Never let a formula refer to the cell it is written in — the spreadsheet reports a circular reference and shows no answer at all.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '7.7',
    figure: 'sheet-absolute-rate',
    stem: 'In the given worksheet, B3 must calculate Pay as Hours × Rate, and the formula will then be **copied down** to B4. Which formula should be entered in B3?',
    options: ['=A3*B1', '=A3*$B$1', '=$A$3*B1', '=$A$3*$B$1'],
    correct: 1,
    misconceptions: [
      'When this is copied to B4 the reference to B1 shifts to B2, which holds the word "Pay", not the rate.',
      '',
      'Locking A3 means B4 would use 8 hours instead of its own 6 hours.',
      'Locking both means B4 calculates exactly the same pay as B3, ignoring its own row entirely.',
    ],
    explanation:
      'When a formula is copied down a column, a **relative** reference shifts with it and an **absolute** one does not. The hours must change from row to row, so A3 stays relative. The rate is always in B1, so it must be locked as **$B$1**. Copying =A3*$B$1 into B4 gives =A4*$B$1, which is exactly what is wanted.',
    examTip:
      'Ask of each reference: "should this move when I copy?" If no, put a $ before both the column letter and the row number.',
    difficulty: 'hard',
    cognitive: 'application',
  },

  /* ---------------- 9.4 relational databases ---------------- */
  {
    topic: '9.4',
    figure: 'db-student-subject',
    stem: 'In the given database, which field in the **ENROLMENT** table is a foreign key?',
    options: [
      'Marks only',
      'Student_ID only',
      'Both Student_ID and Subject_ID',
      'ENROLMENT has no foreign key',
    ],
    correct: 2,
    misconceptions: [
      'Marks holds a score, not a reference to a row in another table.',
      'Student_ID is a foreign key, but it is not the only one — Subject_ID refers to another table too.',
      '',
      'A table that links two other tables together is exactly where foreign keys are found.',
    ],
    explanation:
      'A **foreign key** is a field in one table that refers to the primary key of another table. In ENROLMENT, Student_ID refers to the primary key of STUDENT and Subject_ID refers to the primary key of SUBJECT, so **both** are foreign keys. This is how a many-to-many relationship is stored.',
    examTip:
      'A foreign key is recognised by where it *points*, not by its name. Check whether its values appear as the primary key of another table.',
    difficulty: 'hard',
    cognitive: 'analysis',
  },
  {
    topic: '9.4',
    figure: 'db-student-subject',
    stem: 'In the given database, why is **Student_ID alone** unsuitable as the primary key of the ENROLMENT table?',
    options: [
      'Because it is a text field rather than a number',
      'Because the value S001 appears in more than one row',
      'Because a primary key may not be copied from another table',
      'Because ENROLMENT has three fields and a primary key needs exactly one',
    ],
    correct: 1,
    misconceptions: [
      'Primary keys are very often text. S001 and SU01 are both text and both serve as keys elsewhere.',
      '',
      'A field can be both a foreign key here and part of the primary key. Being copied is not the problem.',
      'A primary key can be made of several fields together — that is called a composite primary key.',
    ],
    explanation:
      'A primary key must be **unique** in every row. S001 appears twice in ENROLMENT, because that student is enrolled for two subjects, so Student_ID on its own cannot identify a row. Student_ID and Subject_ID **together** are unique, which makes them a composite primary key.',
    examTip:
      'Test a candidate key by looking down its column for a repeat. One repeated value rules it out on its own.',
    difficulty: 'hard',
    cognitive: 'analysis',
  },

  /* ---------------- 3.3 place value ---------------- */
  {
    topic: '3.3',
    figure: 'place-value-8bit',
    stem: 'The given place-value frame holds an 8-bit binary number. What is its value in decimal?',
    options: ['165', '181', '183', '211'],
    correct: 1,
    misconceptions: [
      'This is what you get by reading the bits in the wrong order, from right to left.',
      '',
      'This adds 2¹ as well, but the digit in the 2¹ column is 0.',
      'This counts 2⁶ as set, but the digit in that column is 0.',
    ],
    explanation:
      'Add the weighting factors of the columns holding a 1. The digits are 1 0 1 1 0 1 0 1, so the columns set are 2⁷, 2⁵, 2⁴, 2² and 2⁰: 128 + 32 + 16 + 4 + 1 = **181**.',
    examTip:
      'Write the weightings above the digits before you add anything. Losing track of which column you are in is what turns 181 into 165.',
    difficulty: 'medium',
    cognitive: 'application',
  },

  /* ================================================================
   * UNIT 3 — DATA REPRESENTATION
   * Conversion is the single most examined skill in the paper, so it
   * gets the most items. Every value below is re-derived in
   * questions.test.ts rather than trusted.
   * ================================================================ */
  {
    topic: '3.3',
    stem: 'What is the decimal value of the binary number **10011011₂**?',
    options: ['151', '155', '157', '219'],
    correct: 1,
    misconceptions: [
      'This counts the 2² column as set, but the digit there is 0 — it is 2³ that holds a 1.',
      '',
      'This counts both 2³ and 2² as set. Only 2³ holds a 1.',
      'This counts the 2⁶ column as set, but the digit in that column is 0.',
    ],
    explanation:
      'Add the weightings of the columns holding a 1. For 1 0 0 1 1 0 1 1 those are ' +
      '2⁷, 2⁴, 2³, 2¹ and 2⁰: 128 + 16 + 8 + 2 + 1 = **155**.',
    examTip:
      'Write 128 64 32 16 8 4 2 1 above the digits before you start. Every conversion mark in this paper is won or lost on that one line.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '3.3',
    stem: 'What is **200₁₀** in binary?',
    options: ['11001000₂', '11000100₂', '10011000₂', '11101000₂'],
    correct: 0,
    misconceptions: [
      '',
      'This is 196. Check the 2³ and 2² columns.',
      'This is 152 — the 2⁶ and 2⁴ columns have been swapped.',
      'This is 232, which is 32 too many.',
    ],
    explanation:
      'Divide by 2 repeatedly and read the remainders upwards, or subtract the largest powers of two: 200 − 128 = 72, 72 − 64 = 8, 8 − 8 = 0. So the columns 2⁷, 2⁶ and 2³ are set, giving **11001000₂**.',
    examTip:
      'Check your answer by converting it straight back. It costs ten seconds and catches almost every slip.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '3.3',
    stem: 'What is **156₁₀** in hexadecimal?',
    options: ['8C₁₆', '9B₁₆', '9C₁₆', 'A6₁₆'],
    correct: 2,
    misconceptions: [
      'This is 140. The first hexadecimal digit should be 9, not 8.',
      'This is 155 — the second digit is one short.',
      '',
      'This is 166, which is 10 too many.',
    ],
    explanation:
      '156 ÷ 16 = 9 remainder 12. The quotient 9 is the first digit and the remainder 12 is written as the hexadecimal digit **C**, giving **9C₁₆**. Checking: 9 × 16 + 12 = 156.',
    examTip:
      'Learn the letters cold: A = 10, B = 11, C = 12, D = 13, E = 14, F = 15. Writing 12 instead of C loses the mark.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '3.3',
    stem: 'What is **347₈** in decimal?',
    options: ['198', '231', '347', '839'],
    correct: 1,
    misconceptions: [
      'This uses the wrong place values. In octal the columns are 64, 8 and 1.',
      '',
      'The digits are unchanged only when the base is unchanged. This number is in base 8.',
      'This treats the columns as powers of ten with an octal twist, which mixes the two bases.',
    ],
    explanation:
      'Octal columns are powers of eight: 8² = 64, 8¹ = 8, 8⁰ = 1. So 347₈ = (3 × 64) + (4 × 8) + (7 × 1) = 192 + 32 + 7 = **231**.',
    examTip:
      'The largest digit in octal is 7. If a question shows an 8 or a 9 in an octal number, the number itself is invalid.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '3.3',
    stem: 'What is **1F₁₆** in binary?',
    options: ['11111₂', '11110₂', '10111₂', '111111₂'],
    correct: 0,
    misconceptions: [
      '',
      'This is 1E. F is 15, which is 1111 in binary, not 1110.',
      'This is 17₁₆. The digits have been converted in the wrong order.',
      'This is 3F, one bit too many.',
    ],
    explanation:
      'Each hexadecimal digit becomes exactly four bits. 1 becomes 0001 and F (15) becomes 1111, giving 0001 1111, which is **11111₂** once the leading zeros are dropped.',
    examTip:
      'Hex to binary needs no arithmetic at all — convert each digit to four bits and join them. This is why hexadecimal is used as shorthand for binary.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '3.3',
    stem: 'What is **11011₂** in octal?',
    options: ['27₈', '33₈', '54₈', '66₈'],
    correct: 1,
    misconceptions: [
      'This is the decimal value of 11011₂, not its octal form.',
      '',
      'This doubles the correct answer, as though the bits were grouped wrongly.',
      'This groups the bits from the left instead of from the right.',
    ],
    explanation:
      'Group the bits into threes **starting from the right**: 11011 becomes 011 and 011. Each group of three bits is one octal digit: 011 = 3 and 011 = 3, giving **33₈**. Checking: 3 × 8 + 3 = 27, which is 11011₂.',
    examTip:
      'Always group from the right and pad the left group with zeros. Grouping from the left is the classic way to get this wrong.',
    difficulty: 'hard',
    cognitive: 'application',
  },
  {
    topic: '3.2',
    stem: 'Which of the following is **not** a valid number in the base it claims to be written in?',
    options: ['1011₂', '785₈', 'B4₁₆', '904₁₀'],
    correct: 1,
    misconceptions: [
      'Binary uses only 0 and 1, and this number uses only those digits.',
      '',
      'Hexadecimal uses 0–9 and A–F, so B is a valid digit.',
      'Decimal uses 0–9, and all three digits here are within that range.',
    ],
    explanation:
      'A number system with base *n* uses exactly *n* digits, from 0 to *n* − 1. Octal is base 8, so its digits run 0 to **7** — the 8 in 785₈ is not an octal digit at all.',
    examTip:
      'The biggest digit in any base is one less than the base. This alone answers a whole family of questions.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '3.4',
    stem: 'A pen drive is described as having a capacity of **4 GB**. How many megabytes is that?',
    options: ['400 MB', '4000 MB', '4096 MB', '40 960 MB'],
    correct: 2,
    misconceptions: [
      'This divides by 10 instead of multiplying by 1024.',
      'This uses 1000 as the multiplier. Storage units in this syllabus step by 1024.',
      '',
      'This multiplies by 10 240 rather than 1024.',
    ],
    explanation:
      'Each storage unit is 2¹⁰ = **1024** of the one below it, so 4 GB = 4 × 1024 = **4096 MB**.',
    examTip:
      'The ladder is bit → byte → KB → MB → GB → TB, and every rung above byte is a factor of 1024.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '3.4',
    stem: 'How many **kilobytes** are there in 3.5 MB?',
    options: ['350 KB', '3500 KB', '3584 KB', '3850 KB'],
    correct: 2,
    misconceptions: [
      'This multiplies by 100 rather than by 1024.',
      'This uses 1000 KB to a megabyte instead of 1024.',
      '',
      'This uses 1100 as the multiplier, which is not a power of two.',
    ],
    explanation:
      'Every step up the storage ladder is a factor of 2¹⁰ = **1024**, not 1000. ' +
      'So 1 MB = 1024 KB, and 3.5 MB = 3.5 × 1024 = **3584 KB**. The half ' +
      'megabyte contributes 512 KB, which is where the answer parts company ' +
      'with the 3500 you get from using 1000.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '3.1',
    stem: 'How many different values can be represented using **8 bits**?',
    options: ['8', '64', '256', '512'],
    correct: 2,
    misconceptions: [
      'This is the number of bits, not the number of combinations they can make.',
      'This is 2⁶, which is the number of combinations of 6 bits.',
      '',
      'This is 2⁹. Recount the bits.',
    ],
    explanation:
      'Each bit has two possible states, so *n* bits give 2ⁿ combinations. For 8 bits that is 2⁸ = **256** — which is why one byte can hold any value from 0 to 255.',
    examTip:
      'Memorise 2⁴ = 16, 2⁸ = 256, 2¹⁰ = 1024. Between them they answer most bit-counting questions in the paper.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '3.5',
    stem: 'In the ASCII coding system the character **A** is 65. What is the ASCII value of the character **D**?',
    options: ['66', '67', '68', '69'],
    correct: 2,
    misconceptions: [
      'This is B, one letter along from A.',
      'This is C, two letters along.',
      '',
      'This is E, four letters along. D is the fourth letter, so it is A + 3.',
    ],
    explanation:
      'ASCII gives the capital letters consecutive codes: A is 65, B is 66, C is 67 and D is **68**. D is the fourth letter, so its code is 65 + 3.',
    examTip:
      'Count the *steps* from A, not the position of the letter. D is the 4th letter but only 3 steps from A.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '4.1',
    stem: 'How many rows are there in the truth table of a logic gate with **three** inputs?',
    options: ['3', '6', '8', '9'],
    correct: 2,
    misconceptions: [
      'This is the number of inputs, not the number of combinations of them.',
      'This is 3 × 2. Each input doubles the number of rows rather than adding two.',
      '',
      'This is 3², but the base is the number of states per input, which is 2.',
    ],
    explanation:
      'Each input can be 0 or 1, so *n* inputs give 2ⁿ combinations. For three inputs that is 2³ = **8** rows.',
    examTip:
      'Two inputs give 4 rows, three give 8, four give 16. Counting the rows first also stops you from missing one.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '4.2',
    stem: 'An alarm should ring when a door sensor **or** a window sensor detects an intruder. Which gate should be used, and what is the output when both sensors are triggered at once?',
    options: [
      'OR gate, and the output is 1',
      'OR gate, and the output is 0',
      'AND gate, and the output is 1',
      'XOR gate, and the output is 1',
    ],
    correct: 0,
    misconceptions: [
      '',
      'An OR gate outputs 1 when at least one input is 1, so two 1s still give 1.',
      'An AND gate would fail to ring the alarm when only one sensor was triggered.',
      'An XOR gate outputs 0 when both inputs are 1, so the alarm would fall silent in the worst case.',
    ],
    explanation:
      'Either sensor alone must ring the alarm, which is the **OR** operation. An OR gate outputs 1 when *at least one* input is 1, so with both sensors triggered the output is still **1**. This is the difference between OR and XOR, and the reason XOR would be a dangerous choice here.',
    examTip:
      'When "or" appears in a safety context, check the both-at-once row. It is where OR and XOR come apart.',
    difficulty: 'medium',
    cognitive: 'application',
  },

  /* ================================================================
   * UNITS 2, 5 — HARDWARE AND OPERATING SYSTEMS
   * ================================================================ */
  {
    topic: '2.2',
    stem: 'Which of the following devices is used **both** for input and for output?',
    options: ['Scanner', 'Plotter', 'Touch screen', 'Barcode reader'],
    correct: 2,
    misconceptions: [
      'A scanner only reads a document into the computer, so it is an input device.',
      'A plotter only draws what the computer sends it, so it is an output device.',
      '',
      'A barcode reader only reads a code into the computer, so it is input only.',
    ],
    explanation:
      'A **touch screen** displays what the computer sends it, which is output, and senses where the user touches, which is input. Devices that do both are the ones examiners ask about.',
    examTip:
      'Ask which way the data flows. Into the computer is input, out of it is output, both ways means the answer.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '2.2',
    stem: 'A bank needs to read the account numbers printed along the bottom of cheques. Which technology is designed for this?',
    options: ['OMR', 'OCR', 'MICR', 'Barcode reader'],
    correct: 2,
    misconceptions: [
      'OMR detects pencil marks in fixed positions, as on a multiple-choice answer sheet.',
      'OCR converts a picture of ordinary printed text into editable characters.',
      '',
      'A barcode reader reads a pattern of bars, which is not what appears on a cheque.',
    ],
    explanation:
      '**MICR** — Magnetic Ink Character Recognition — reads characters printed in magnetic ink. Banks use it for cheques because the magnetic ink can still be read when the cheque is folded, stamped or written over.',
    examTip:
      'Match the reader to the medium: pencil marks → OMR, printed text → OCR, magnetic ink → MICR, bars → barcode.',
    difficulty: 'medium',
    cognitive: 'recall',
  },
  {
    topic: '2.3',
    stem: 'Which port is designed to carry **both** high-definition video and audio over a single cable?',
    options: ['VGA', 'HDMI', 'RJ45', 'PS/2'],
    correct: 1,
    misconceptions: [
      'VGA carries analogue video only; sound needs a separate cable.',
      '',
      'RJ45 is the network port, used for a UTP cable, not for a display.',
      'PS/2 is the old round port for a keyboard or mouse.',
    ],
    explanation:
      '**HDMI** (High-Definition Multimedia Interface) carries digital video and audio together, which is why one cable is enough between a laptop and a modern television.',
    examTip:
      'The clue is in the name — *Multimedia* means more than one medium, so video and audio together.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '2.4',
    stem: 'Which part of the CPU **decodes instructions and directs** the other parts of the computer?',
    options: ['Arithmetic and Logic Unit', 'Control Unit', 'Cache memory', 'Register'],
    correct: 1,
    misconceptions: [
      'The ALU performs the calculations and comparisons; it does not direct anything.',
      '',
      'Cache is fast memory close to the processor. It stores data rather than issuing instructions.',
      'A register is a very small store inside the CPU, not a controller.',
    ],
    explanation:
      'The **Control Unit** fetches each instruction, decodes it, and sends signals telling the other units what to do. The ALU does the arithmetic and logic, and registers hold the values being worked on.',
    examTip:
      'ALU calculates, Control Unit commands. If a question says "directs", "controls" or "coordinates", it is the CU.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '2.4',
    stem: 'Which statement about **RAM** is correct?',
    options: [
      'It keeps its contents when the power is switched off',
      'It loses its contents when the power is switched off',
      'Its contents can be read but never changed',
      'It is slower to access than a hard disk',
    ],
    correct: 1,
    misconceptions: [
      'That describes ROM and secondary storage. RAM is volatile.',
      '',
      'Read-only describes ROM. The whole point of RAM is that it can be written to.',
      'RAM is far faster than a hard disk, which is why programs are copied into it to run.',
    ],
    explanation:
      'RAM is **volatile**: it holds the programs and data currently in use, and everything in it is lost when power is removed. That is exactly why unsaved work disappears in a power cut, and why permanent storage has to be on a disk.',
    examTip:
      'Volatile means "vanishes". RAM is volatile, ROM and secondary storage are not.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '2.5',
    stem: 'A school connects the computers in one laboratory so they can share a printer and files. What type of network is this?',
    options: ['LAN', 'MAN', 'WAN', 'The internet'],
    correct: 0,
    misconceptions: [
      '',
      'A MAN covers a whole city, which is far larger than one laboratory.',
      'A WAN spans countries or continents.',
      'The internet is the worldwide network of networks, not a single room.',
    ],
    explanation:
      'A **LAN** (Local Area Network) covers a small area such as a room, a building or a school site. The distinguishing feature is geographical size, not the number of computers.',
    examTip:
      'Judge by the area covered: one building → LAN, one city → MAN, country or wider → WAN.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '2.5',
    stem: 'Which device connects **two different networks** together and chooses the path data should take between them?',
    options: ['Hub', 'Switch', 'Router', 'Repeater'],
    correct: 2,
    misconceptions: [
      'A hub copies incoming data to every port on the same network without choosing anything.',
      'A switch forwards data to the right computer, but within a single network.',
      '',
      'A repeater strengthens a weakening signal so a cable can run further.',
    ],
    explanation:
      'A **router** joins separate networks and decides which route data should take between them — which is why a home router sits between the household LAN and the internet.',
    examTip:
      'Hub and switch work inside one network. Router works between networks. That single distinction answers most network-device questions.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '5.1',
    stem: 'Which of the following is **not** a function of an operating system?',
    options: [
      'Managing main memory',
      'Managing files and folders',
      'Editing a photograph',
      'Managing input and output devices',
    ],
    correct: 2,
    misconceptions: [
      'Deciding which program gets which part of memory is a core operating-system job.',
      'Creating, naming, moving and deleting files is file management, an operating-system function.',
      '',
      'Controlling the keyboard, screen and printer through device drivers is an operating-system job.',
    ],
    explanation:
      'Editing a photograph is done by **application software**. The operating system is system software: it manages memory, processes, files and devices so that applications can run at all.',
    examTip:
      'If a task is something a *user* sets out to do, it is an application. If it is something the machine must do to function, it is the operating system.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '5.2',
    stem: 'A file is named `budget.xlsx`. What does the part after the dot tell the operating system?',
    options: [
      'How large the file is',
      'Which type of file it is, and which program opens it',
      'Which folder the file is stored in',
      'When the file was last modified',
    ],
    correct: 1,
    misconceptions: [
      'Size is stored separately by the file system, not encoded in the name.',
      '',
      'The folder is given by the path, which is the part before the file name.',
      'The modification date is a property the file system records, not part of the name.',
    ],
    explanation:
      'The part after the final dot is the **file extension**. It identifies the file type and lets the operating system choose the program that should open it — `.xlsx` for a spreadsheet, `.docx` for a word-processed document, `.mp3` for audio.',
    examTip:
      'Renaming a file’s extension does not convert it. It only changes which program the operating system tries to use.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '5.2',
    stem: 'Which utility rearranges the parts of files so that each file is stored in one continuous area of a hard disk?',
    options: ['Disk formatting', 'Disk defragmentation', 'File compression', 'Disk partitioning'],
    correct: 1,
    misconceptions: [
      'Formatting prepares a disk for use and erases what is on it.',
      '',
      'Compression makes files smaller; it does not change where their parts sit on the disk.',
      'Partitioning divides one physical disk into separate logical drives.',
    ],
    explanation:
      'Over time a file can end up split across scattered areas of a disk, which slows reading. **Defragmentation** gathers the pieces of each file back together so the read head moves less.',
    examTip:
      'Defragment reorganises, compress shrinks, format erases, partition divides. Four different verbs, four different answers.',
    difficulty: 'medium',
    cognitive: 'recall',
  },

  /* ================================================================
   * UNITS 6, 7, 8 — APPLICATION SOFTWARE
   * ================================================================ */
  {
    topic: '6.3',
    stem: 'Which page orientation is **wider than it is tall**?',
    options: ['Portrait', 'Landscape', 'Justified', 'Margin'],
    correct: 1,
    misconceptions: [
      'Portrait is taller than it is wide — the usual orientation for a letter.',
      '',
      'Justified is a text alignment that straightens both edges of a paragraph.',
      'A margin is the blank space around the edge of a page, not an orientation.',
    ],
    explanation:
      '**Landscape** orientation is wider than it is tall, which suits wide tables and charts. Portrait is the taller default.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '7.4',
    stem: 'Which spreadsheet function counts **only the cells in a range that contain numbers**?',
    options: ['SUM', 'COUNT', 'AVERAGE', 'MAX'],
    correct: 1,
    misconceptions: [
      'SUM adds the values together and returns their total, not how many there are.',
      '',
      'AVERAGE returns the mean of the values.',
      'MAX returns the largest value in the range.',
    ],
    explanation:
      '**COUNT** returns how many cells in a range hold numbers, ignoring empty cells and text. It answers "how many?" rather than "how much?".',
    examTip:
      'COUNT counts numbers only. If a question needs text cells counted too, that is COUNTA — a different function.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '7.4',
    stem: 'A pass mark is 50. Which formula displays **Pass** for a mark of exactly 50 in cell B2, and **Fail** for 49?',
    options: [
      '=IF(B2>50,"Pass","Fail")',
      '=IF(B2>=50,"Pass","Fail")',
      '=IF(B2<50,"Pass","Fail")',
      '=IF(B2=50,"Pass","Fail")',
    ],
    correct: 1,
    misconceptions: [
      'The operator > excludes 50 itself, so a mark of exactly 50 would display Fail.',
      '',
      'This reverses the test, so it would display Pass for 49 and Fail for 50.',
      'This tests for exactly 50, so 51 and above would also display Fail.',
    ],
    explanation:
      'The boundary mark of 50 must **pass**, so the test has to include 50 itself. ' +
      'That is what `>=` means — greater than or equal to. With `>` alone a student ' +
      'on exactly the pass mark is failed, which is the classic off-by-one error in ' +
      'spreadsheet conditions.',
    examTip:
      'Whenever a question names a boundary value, test your formula against that exact value first. It is the case being examined.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '7.1',
    stem: 'How many cells are contained in the spreadsheet range **B2:D5**?',
    options: ['8', '9', '12', '15'],
    correct: 2,
    misconceptions: [
      'This counts one row too few. Rows 2, 3, 4 and 5 make four rows.',
      'This counts 3 × 3, but the range spans four rows, not three.',
      '',
      'This counts 3 × 5, using the row number instead of the number of rows.',
    ],
    explanation:
      'The range runs from column B to column D — that is 3 columns — and from row 2 to row 5 — that is 4 rows. So it holds 3 × 4 = **12** cells.',
    examTip:
      'Count the rows by subtracting and adding one: 5 − 2 + 1 = 4. Forgetting the "+ 1" is the standard slip.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '8.2',
    stem: 'In presentation software, what is the difference between an **animation** and a **transition**?',
    options: [
      'An animation applies to an object on a slide; a transition applies between slides',
      'An animation applies between slides; a transition applies to an object on a slide',
      'They are two names for the same effect',
      'An animation is only for text; a transition is only for pictures',
    ],
    correct: 0,
    misconceptions: [
      '',
      'This is the right distinction, but the two terms have been swapped.',
      'They are distinct features, applied to different things.',
      'Both effects can be applied to text and to pictures alike.',
    ],
    explanation:
      'An **animation** controls how an individual object — a heading, a bullet, an image — appears or moves on its slide. A **transition** controls how one whole slide gives way to the next.',
    examTip:
      'Animation is *within* a slide, transition is *between* slides. Saying the words in that order fixes them.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },

  /* ================================================================
   * UNITS 9-15 — DATABASES, PROGRAMMING, SDLC, INTERNET, MULTIMEDIA,
   * WEB, AND ICT IN SOCIETY
   * ================================================================ */
  {
    topic: '9.1',
    stem: 'Which of the following is the most suitable **primary key** for a table of students in a school?',
    options: ['Student’s name', 'Date of birth', 'Admission number', 'Grade'],
    correct: 2,
    misconceptions: [
      'Two students can easily share a name, so it is not guaranteed unique.',
      'Many students in a school share a date of birth.',
      '',
      'Hundreds of students share a grade, so it cannot identify one of them.',
    ],
    explanation:
      'A primary key must be **unique** for every record and must never be blank. An **admission number** is issued once per student and is never reused, which is exactly what a primary key needs. Names, birthdays and grades all repeat.',
    examTip:
      'Test any candidate key by asking "could two people share this?" If yes, it fails.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '9.2',
    stem: 'Which data type should be chosen for a field that stores a student’s **telephone number**?',
    options: ['Number', 'Text', 'Date/Time', 'Currency'],
    correct: 1,
    misconceptions: [
      'A number type would drop a leading zero, turning 0771234567 into 771234567.',
      '',
      'Date/Time is for dates and times only.',
      'Currency is for money, and applies formatting that makes no sense here.',
    ],
    explanation:
      'A telephone number is never calculated with, and it often begins with a zero that a Number field would silently discard. It may also contain spaces or a plus sign. So it is stored as **Text**.',
    examTip:
      'Use Number only when you would actually do arithmetic on the value. Phone numbers, NIC numbers and postcodes are all text.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '10.3',
    stem: 'Which flowchart symbol is a **diamond**, and what does it represent?',
    options: [
      'A process step',
      'A decision, where the flow branches on a condition',
      'An input or output operation',
      'The start or the end of the algorithm',
    ],
    correct: 1,
    misconceptions: [
      'A process is drawn as a rectangle.',
      '',
      'Input and output are drawn as a parallelogram.',
      'Start and end are drawn as a rounded box, sometimes called a terminator.',
    ],
    explanation:
      'The **diamond** is the decision symbol. A condition is written inside it and the flow leaves by one of two branches, usually labelled Yes and No.',
    examTip:
      'Rounded box = start/end, parallelogram = input/output, rectangle = process, diamond = decision. Learn the four shapes as a set.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '10.3',
    stem: 'Consider the pseudocode:\n\n```\nBEGIN\n  Total = 0\n  FOR I = 1 TO 5\n    Total = Total + I\n  ENDFOR\n  DISPLAY Total\nEND\n```\n\nWhat is displayed?',
    options: ['5', '15', '25', '120'],
    correct: 1,
    misconceptions: [
      'This is the final value of I, not the running total.',
      '',
      'This is 5², but the loop adds the values rather than squaring anything.',
      'This is 1 × 2 × 3 × 4 × 5. The loop adds; it does not multiply.',
    ],
    explanation:
      'Total starts at 0 and the loop adds each value of I from 1 to 5: 0 + 1 + 2 + 3 + 4 + 5 = **15**.',
    examTip:
      'Trace loops with a table of values. Five rows takes twenty seconds and removes all guesswork.',
    difficulty: 'medium',
    cognitive: 'application',
  },
  {
    topic: '10.4',
    stem: 'In Pascal, which statement correctly assigns the value 10 to the variable `count`?',
    options: ['count = 10;', 'count := 10;', 'count == 10;', 'let count = 10;'],
    correct: 1,
    misconceptions: [
      'A single equals sign is the *comparison* operator in Pascal, not assignment.',
      '',
      'Double equals is comparison in languages such as C and Java, and is not Pascal at all.',
      '`let` is not a Pascal keyword.',
    ],
    explanation:
      'Pascal uses **:=** for assignment and reserves **=** for testing equality. Each statement ends with a semicolon.',
    examTip:
      'In Pascal, := puts a value in, = asks a question. Mixing them up is the most common Pascal error in the paper.',
    difficulty: 'medium',
    cognitive: 'recall',
  },
  {
    topic: '10.5',
    stem: 'What is the main difference between a **compiler** and an **interpreter**?',
    options: [
      'A compiler translates the whole program at once; an interpreter translates and runs it line by line',
      'A compiler translates line by line; an interpreter translates the whole program at once',
      'A compiler runs only high-level languages; an interpreter runs only machine code',
      'There is no difference; the two words mean the same thing',
    ],
    correct: 0,
    misconceptions: [
      '',
      'This is the right distinction with the two terms swapped.',
      'Both translate high-level source code. Machine code needs no translation.',
      'They are genuinely different approaches with different trade-offs.',
    ],
    explanation:
      'A **compiler** translates the entire source program into machine code before it runs, producing a file that can be executed on its own. An **interpreter** translates and executes one statement at a time, so errors surface as it reaches them but execution is generally slower.',
    examTip:
      'Compiler = translate everything, then run. Interpreter = translate and run together, line by line.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '11.2',
    stem: 'In the system development life cycle, which stage determines **what the new system must do**, before any design work begins?',
    options: [
      'Requirement analysis',
      'Design',
      'Implementation',
      'Testing',
    ],
    correct: 0,
    misconceptions: [
      '',
      'Design decides *how* the system will meet the requirements, which comes after knowing what they are.',
      'Implementation is the writing of the actual programs.',
      'Testing checks the built system against the requirements, so it comes much later.',
    ],
    explanation:
      '**Requirement analysis** establishes what the system has to achieve, by studying the existing system and interviewing the people who will use it. Designing before knowing the requirements means designing the wrong system.',
    examTip:
      'The order is analysis → design → implementation → testing → deployment → maintenance. Questions usually test one adjacent pair.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '11.2',
    stem: 'Which type of testing checks that the **separate modules of a system work correctly together**?',
    options: ['Unit testing', 'Integration testing', 'Acceptance testing', 'Alpha testing'],
    correct: 1,
    misconceptions: [
      'Unit testing checks one module on its own.',
      '',
      'Acceptance testing is carried out by the customer to decide whether to accept the system.',
      'Alpha testing is early testing carried out in-house before release.',
    ],
    explanation:
      '**Integration testing** combines modules that have already passed unit testing and checks that they work correctly with one another — which is where interface faults appear.',
    examTip:
      'Unit = one part alone. Integration = parts together. Acceptance = the customer decides.',
    difficulty: 'medium',
    cognitive: 'recall',
  },
  {
    topic: '12.1',
    stem: 'In the URL `http://www.nie.lk/index.html`, which part is the **domain name**?',
    options: ['http', 'www.nie.lk', '/index.html', '.html'],
    correct: 1,
    misconceptions: [
      'http is the protocol — the set of rules used to transfer the page.',
      '',
      'This is the path and file name of the particular page being requested.',
      'This is the file extension, showing that the file is an HTML document.',
    ],
    explanation:
      'A URL has three parts: the **protocol** (`http`), the **domain name** identifying the server (`www.nie.lk`), and the **path** to the resource on it (`/index.html`).',
    examTip:
      'Split any URL at :// and at the first single slash. Protocol, then domain, then path — every time.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '12.1',
    stem: 'Which protocol is used to transfer web pages between a web server and a browser **securely**?',
    options: ['FTP', 'SMTP', 'HTTPS', 'POP'],
    correct: 2,
    misconceptions: [
      'FTP transfers files between computers, but is not the protocol of the web.',
      'SMTP sends email.',
      '',
      'POP retrieves email from a mail server.',
    ],
    explanation:
      '**HTTPS** is HTTP with encryption added, so a page and anything typed into it cannot be read in transit. The padlock shown by a browser indicates HTTPS, which is why it matters for passwords and payments.',
    examTip:
      'The final S means secure. Any protocol name ending in S is the encrypted version of the one without it.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '12.2',
    stem: 'An email is sent to one recipient in the **To** field and another in the **Bcc** field. What does the person in the To field see?',
    options: [
      'Both addresses',
      'Only their own address',
      'Only the Bcc address',
      'Neither address',
    ],
    correct: 1,
    misconceptions: [
      'Bcc stands for blind carbon copy — its whole purpose is that it is not shown.',
      '',
      'The To recipient always sees the To field, which contains their own address.',
      'The To field is always visible to everyone who receives the message.',
    ],
    explanation:
      '**Bcc** hides a recipient from everybody else. The person in the To field sees the To and Cc fields but has no way of knowing a Bcc recipient exists. That is what distinguishes Bcc from Cc.',
    examTip:
      'Cc is visible to all, Bcc is visible to nobody but the sender. The "blind" in the name is the whole answer.',
    difficulty: 'medium',
    cognitive: 'understanding',
  },
  {
    topic: '12.3',
    stem: 'Which of the following is a benefit of **cloud storage** over storing files only on a school computer?',
    options: [
      'Files can be reached from any device with an internet connection',
      'Files can never be lost under any circumstances',
      'Files no longer need any storage space at all',
      'Files become impossible for anyone else to read',
    ],
    correct: 0,
    misconceptions: [
      '',
      'No storage is completely safe. Accounts can be lost and providers can fail, which is why backups still matter.',
      'The files still occupy space; it is simply on someone else’s servers rather than yours.',
      'Security depends on the password and the provider. Cloud storage is not automatically private.',
    ],
    explanation:
      'The defining advantage of cloud storage is **access from anywhere** with an internet connection, on any device. The other three options are the common overclaims — cloud storage still uses space, still needs backups, and still needs securing.',
    examTip:
      'Beware options containing "never", "always" or "impossible". In ICT they are almost always false.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '13.1',
    stem: 'An image is 1000 pixels wide and 800 pixels high. What is its **resolution** in pixels?',
    options: ['1800', '80 000', '800 000', '8 000 000'],
    correct: 2,
    misconceptions: [
      'This adds the two dimensions instead of multiplying them.',
      'This is 100 × 800; one of the dimensions has lost a zero.',
      '',
      'This is ten times too large.',
    ],
    explanation:
      'The total number of pixels is width × height: 1000 × 800 = **800 000** pixels. More pixels means more detail — and a larger file.',
    examTip:
      'Resolution multiplies; it never adds. Check the size of your answer against the two numbers you were given.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '13.3',
    stem: 'Which file format stores **audio**?',
    options: ['JPEG', 'MP3', 'GIF', 'PNG'],
    correct: 1,
    misconceptions: [
      'JPEG is a compressed image format, used mostly for photographs.',
      '',
      'GIF is an image format that also supports simple animation.',
      'PNG is an image format supporting transparency.',
    ],
    explanation:
      '**MP3** is a compressed audio format. JPEG, GIF and PNG are all image formats.',
    examTip:
      'Group the formats by medium before the exam: images (JPEG, PNG, GIF, BMP), audio (MP3, WAV), video (MP4, AVI).',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '14.2',
    stem: 'Which HTML tag creates a **hyperlink**?',
    options: ['&lt;link&gt;', '&lt;a&gt;', '&lt;href&gt;', '&lt;url&gt;'],
    correct: 1,
    misconceptions: [
      '&lt;link&gt; connects a page to an external resource such as a stylesheet; it does not make a clickable link.',
      '',
      'href is an *attribute* of the anchor tag, not a tag in its own right.',
      'There is no &lt;url&gt; tag in HTML.',
    ],
    explanation:
      'The anchor tag **&lt;a&gt;** creates a hyperlink, and its `href` attribute holds the address: `&lt;a href="page.html"&gt;Click here&lt;/a&gt;`. The text between the opening and closing tags is what the user clicks.',
    examTip:
      'Keep tags and attributes apart. &lt;a&gt; is the tag; href is an attribute that lives inside it.',
    difficulty: 'medium',
    cognitive: 'recall',
  },
  {
    topic: '14.2',
    stem: 'In an HTML document, which section holds the content that is **displayed in the browser window**?',
    options: ['&lt;head&gt;', '&lt;title&gt;', '&lt;body&gt;', '&lt;meta&gt;'],
    correct: 2,
    misconceptions: [
      'The head holds information *about* the page, which is not displayed in the page itself.',
      'The title appears on the browser tab, not in the page.',
      '',
      'A meta tag carries information about the document for browsers and search engines.',
    ],
    explanation:
      'An HTML document has two main sections. The **&lt;head&gt;** holds information about the page — its title, its character set, links to stylesheets. The **&lt;body&gt;** holds everything the visitor actually sees.',
    examTip:
      'Head is about the page, body is the page. If a student can see it, it is in the body.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '15.2',
    stem: 'A student receives an email that appears to be from their bank, asking them to confirm their password on a linked page. This is an example of:',
    options: ['Phishing', 'Spam', 'A computer virus', 'Plagiarism'],
    correct: 0,
    misconceptions: [
      '',
      'Spam is unwanted bulk email. This message is targeted and is trying to steal something specific.',
      'A virus is a program that attaches itself to files and spreads. No program is involved here.',
      'Plagiarism is presenting someone else’s work as your own.',
    ],
    explanation:
      '**Phishing** tricks someone into handing over passwords or account details by impersonating an organisation they trust. Banks never ask for a password by email, which is the practical thing to take away.',
    examTip:
      'Phishing steals information by deception. A virus damages or spreads by code. The distinction is the method, not the harm.',
    difficulty: 'easy',
    cognitive: 'understanding',
  },
  {
    topic: '15.2',
    stem: 'Which health problem is most directly caused by using a keyboard and mouse for long periods with poor posture?',
    options: [
      'Repetitive Strain Injury',
      'Computer Vision Syndrome',
      'Hearing loss',
      'Skin irritation',
    ],
    correct: 0,
    misconceptions: [
      '',
      'Computer Vision Syndrome is caused by looking at a screen for long periods, not by typing.',
      'Hearing loss comes from loud sound, typically headphones at high volume.',
      'Skin problems are not a recognised effect of keyboard use.',
    ],
    explanation:
      '**Repetitive Strain Injury** affects the wrists, arms and shoulders and is caused by the same small movements repeated for long periods, made worse by poor posture. Correct chair height, wrist position and regular breaks are the defence.',
    examTip:
      'Match the symptom to the organ: hands and wrists → RSI, eyes → CVS, ears → hearing damage.',
    difficulty: 'easy',
    cognitive: 'recall',
  },
  {
    topic: '15.2',
    stem: 'Which practice best protects a computer against **data loss** caused by hardware failure?',
    options: [
      'Installing antivirus software',
      'Taking regular backups to a separate device',
      'Using a strong password',
      'Defragmenting the hard disk',
    ],
    correct: 1,
    misconceptions: [
      'Antivirus software guards against malware, not against a disk that stops working.',
      '',
      'A password controls who may access the computer. It does nothing when the hardware fails.',
      'Defragmentation improves performance; it does not protect the data if the disk dies.',
    ],
    explanation:
      'If a hard disk fails, the only thing that recovers the data is a **backup held somewhere else**. Antivirus, passwords and defragmentation each solve a different problem.',
    examTip:
      'Read what the threat actually is. Each of these four answers is correct for *some* question — just not this one.',
    difficulty: 'easy',
    cognitive: 'application',
  },
  {
    topic: '1.1',
    stem: 'A citizen renews a driving licence through a government website. Which type of e-government service is this?',
    options: ['G2C', 'G2B', 'G2G', 'G2E'],
    correct: 0,
    misconceptions: [
      '',
      'G2B is Government to Business, such as a company filing its taxes online.',
      'G2G is Government to Government, where one department exchanges data with another.',
      'G2E is Government to Employee, covering services for government staff.',
    ],
    explanation:
      'The service is provided by the government directly to an individual member of the public, which is **G2C** — Government to Citizen.',
    examTip:
      'Identify who is on each end. The second letter names who receives the service: C for citizen, B for business, G for government, E for employee.',
    difficulty: 'easy',
    cognitive: 'application',
  },
];
