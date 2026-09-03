/**
 * The G.C.E. O/L ICT syllabus, transcribed from the source documents in this
 * repository — NOT invented.
 *
 *   Grade 10, competencies 1–9
 *     textbooks/ICT_G10_TG_and_Syllabus_English_Medium.pdf
 *     ("Subject Content and Time Duration by Competencies and Competency
 *      Levels", Teacher's Guide revised 2026). Period counts are the
 *      syllabus's own allocations and are used to weight coverage.
 *
 *   Grade 11, competencies 10–15
 *     textbooks/ICT G-11 E.pdf, chapters 1–6. The Grade 11 Teacher's Guide
 *     was not supplied, so unit and topic titles follow the textbook's own
 *     chapter and section headings. Period counts are therefore null rather
 *     than guessed.
 *
 * Mapping to the schema:
 *   unit     = NIE "Competency"        (1, 2, 3 …)
 *   topic    = NIE "Competency Level"  (3.2, 3.3 …)
 *   subtopic = a content bullet
 */

export type TopicSeed = {
  code: string;
  title: string;
  /** Teaching periods from the syllabus; null where not published. */
  periods: number | null;
  subtopics: string[];
};

export type UnitSeed = {
  code: string;
  title: string;
  grade: 10 | 11;
  topics: TopicSeed[];
};

export const OL_ICT_SYLLABUS: UnitSeed[] = [
  /* ---------------- GRADE 10 ---------------- */
  {
    code: '1',
    title: 'The place of the computer in the world of information',
    grade: 10,
    topics: [
      {
        code: '1.1',
        title: 'The contribution of ICT towards national development',
        periods: 3,
        subtopics: [
          'Introduction to ICT',
          'ICT in e-government and public services',
          'ICT in agriculture, health and education',
          'ICT in industry, entertainment and defence',
          'ICT in media, communication and social networking',
          'ICT and the environment',
        ],
      },
      {
        code: '1.2',
        title: 'The computer as a system for converting data into information',
        periods: 2,
        subtopics: [
          'Components of a system',
          'Difference between data and information',
          'Data as input and information as output',
          'Processing as the method of conversion',
        ],
      },
      {
        code: '1.3',
        title: 'The evolution of computers',
        periods: 2,
        subtopics: [
          'Computer generations',
          'Vacuum tubes, transistors and integrated circuits',
          'LSI, VLSI and quantum computing',
          'Improvements in size, capacity, speed, accuracy and efficiency',
        ],
      },
    ],
  },
  {
    code: '2',
    title: 'Computer hardware',
    grade: 10,
    topics: [
      {
        code: '2.1',
        title: 'Classifying computers',
        periods: 1,
        subtopics: [
          'Classification by size: super, mainframe, mini, micro',
          'Classification by technology: digital, analog, hybrid',
        ],
      },
      {
        code: '2.2',
        title: 'Computer systems by function',
        periods: 3,
        subtopics: [
          'Input devices',
          'Processing',
          'Output devices',
          'Storage devices',
          'Communication devices',
        ],
      },
      {
        code: '2.3',
        title: 'Basic peripherals and ports',
        periods: 2,
        subtopics: [
          'Keyboard, mouse, system unit and monitor',
          'USB port',
          'Ethernet port',
          'Video ports: VGA and HDMI',
          'Audio ports',
          'Obsolete ports: PS/2, serial and parallel',
        ],
      },
      {
        code: '2.4',
        title: 'The basic block diagram of a computer',
        periods: 2,
        subtopics: [
          'CPU: control unit',
          'CPU: arithmetic and logic unit',
          'Memory registers',
          'Control signals',
          'Data and instruction signals',
        ],
      },
      {
        code: '2.5',
        title: 'Computer networks',
        periods: 3,
        subtopics: [
          'Purpose of networking: data communication and resource sharing',
          'Networking devices: NIC, modem, switch, hub, router, firewall',
          'Wired transmission media: twisted pair, coaxial, fibre optic',
          'Wireless transmission media: radio, infrared, microwave',
          'Network operating systems',
          'Types of network: LAN, WAN, PAN',
          'Advantages and disadvantages of networks',
        ],
      },
    ],
  },
  {
    code: '3',
    title: 'Data representation',
    grade: 10,
    topics: [
      {
        code: '3.1',
        title: 'The binary number system',
        periods: 2,
        subtopics: [
          'Two-state systems using 1 and 0',
          'Multi-state systems and quantum computing',
          'Representing positive decimal integers in binary',
        ],
      },
      {
        code: '3.2',
        title: 'Number systems and their bases',
        periods: 2,
        subtopics: [
          'Decimal, binary, octal and hexadecimal',
          'Position values in each base',
          'Why different number systems are needed',
        ],
      },
      {
        code: '3.3',
        title: 'Conversion between number systems',
        periods: 4,
        subtopics: [
          'Binary to decimal',
          'Octal to decimal',
          'Hexadecimal to decimal',
          'Binary to octal and octal to binary',
          'Binary to hexadecimal and hexadecimal to binary',
          'Octal to hexadecimal and hexadecimal to octal',
        ],
      },
      {
        code: '3.4',
        title: 'Data storage capacity',
        periods: 2,
        subtopics: [
          'Units: bit, byte, kilobyte, megabyte, gigabyte, terabyte, petabyte',
          'Order of capacity: registers, cache, RAM, ROM',
          'Optical media: CD, DVD, Blu-ray',
          'Flash memory, hard disk and SSD',
          'Cloud storage',
        ],
      },
      {
        code: '3.5',
        title: 'Coding systems',
        periods: 1,
        subtopics: [
          'BCD',
          'ASCII',
          'Unicode',
          'Limitations of each coding system',
        ],
      },
    ],
  },
  {
    code: '4',
    title: 'Boolean logic and logic gates',
    grade: 10,
    topics: [
      {
        code: '4.1',
        title: 'Basic logic gates and truth tables',
        periods: 2,
        subtopics: [
          'AND gate',
          'OR gate',
          'NOT gate',
          'Truth tables for up to three inputs',
        ],
      },
      {
        code: '4.2',
        title: 'Boolean logic applied to everyday problems',
        periods: 2,
        subtopics: [
          'Universal gates: NAND and NOR',
          'Logic design for alarm systems',
          'Logic design for street lighting',
          'Converting block diagrams into logic diagrams',
        ],
      },
    ],
  },
  {
    code: '5',
    title: 'Operating systems',
    grade: 10,
    topics: [
      {
        code: '5.1',
        title: 'Operating systems by type, function and benefit',
        periods: 4,
        subtopics: [
          'The need for an operating system',
          'Evolution of the computer/human interface',
          'Customising the OS environment',
          'Types: single user, multi-user, multitasking, real-time',
          'Functions: user interface and resource management',
          'Execution of application software',
          'Utilities: partitioning, formatting and defragmentation',
        ],
      },
      {
        code: '5.2',
        title: 'Files and folders',
        periods: 2,
        subtopics: [
          'Drives, folders and files',
          'File extensions',
          'Creating, deleting, renaming and copying',
          'Organising documents into folders',
        ],
      },
    ],
  },
  {
    code: '6',
    title: 'Word processing',
    grade: 10,
    topics: [
      {
        code: '6.1',
        title: 'Concepts and features of word processing',
        periods: 2,
        subtopics: ['Functions of word-processing software', 'The graphical user interface'],
      },
      {
        code: '6.2',
        title: 'Basic tasks',
        periods: 2,
        subtopics: ['Creating new documents', 'Opening existing documents', 'Saving and closing'],
      },
      {
        code: '6.3',
        title: 'Formatting',
        periods: 2,
        subtopics: ['Text formatting', 'Inserting and formatting graphics', 'Shapes'],
      },
      {
        code: '6.4',
        title: 'Tables',
        periods: 2,
        subtopics: [
          'Inserting tables',
          'Column width and row height',
          'Inserting and deleting rows and columns',
          'Splitting and merging cells',
        ],
      },
      {
        code: '6.5',
        title: 'Creating and printing documents',
        periods: 2,
        subtopics: [
          'Spelling and grammar checking',
          'Find and replace',
          'Page setup: paper size, margins and orientation',
          'Print options: copies and page range',
        ],
      },
      {
        code: '6.6',
        title: 'Mail merge',
        periods: 3,
        subtopics: ['Common document and source data', 'Creating a template document', 'Merging data with a template'],
      },
    ],
  },
  {
    code: '7',
    title: 'Spreadsheets',
    grade: 10,
    topics: [
      {
        code: '7.1',
        title: 'Features and functions of a spreadsheet',
        periods: 1,
        subtopics: ['Introduction to spreadsheets', 'The spreadsheet user interface'],
      },
      {
        code: '7.2',
        title: 'Moving around the worksheet and entering data',
        periods: 1,
        subtopics: ['Worksheets, columns, rows and cells', 'Data entry: labels, numbers and formulae'],
      },
      {
        code: '7.3',
        title: 'Basic mathematical operations',
        periods: 1,
        subtopics: ['Operators + − * / ^', 'Calculations using cell addresses'],
      },
      {
        code: '7.4',
        title: 'Built-in functions',
        periods: 3,
        subtopics: ['SUM and AVERAGE', 'MAX and MIN', 'COUNT and COUNTA', 'ROUND'],
      },
      {
        code: '7.5',
        title: 'Conditions, sorting and filtering',
        periods: 3,
        subtopics: ['The IF function', 'Nested IF / IF-ELSE', 'Sorting ascending and descending', 'Filtering data'],
      },
      {
        code: '7.6',
        title: 'Formatting a worksheet',
        periods: 1,
        subtopics: ['Font, size, bold and italic', 'Alignment', 'Decimal places', 'Merge and centre'],
      },
      {
        code: '7.7',
        title: 'Relative and absolute cell references',
        periods: 3,
        subtopics: ['Relative addressing', 'Absolute addressing', 'The RANK function'],
      },
      {
        code: '7.8',
        title: 'Charts',
        periods: 2,
        subtopics: ['Chart types: bar, column, line and pie', 'Choosing the right chart', 'Chart options'],
      },
    ],
  },
  {
    code: '8',
    title: 'Presentation software',
    grade: 10,
    topics: [
      {
        code: '8.1',
        title: 'Producing effective presentations with multimedia',
        periods: 3,
        subtopics: [
          'Introduction to presentation software',
          'Background, slide layout and design',
          'Inserting text and multimedia',
          'Good practice in presentation design',
        ],
      },
      {
        code: '8.2',
        title: 'Animations and transitions',
        periods: 3,
        subtopics: ['Slide transitions', 'Custom animation', 'Slide master', 'Running a slide show'],
      },
    ],
  },
  {
    code: '9',
    title: 'Databases',
    grade: 10,
    topics: [
      {
        code: '9.1',
        title: 'The concept of a database',
        periods: 3,
        subtopics: [
          'Dataset versus database',
          'Advantages of databases',
          'Features of a well-designed database',
          'Manual versus electronic databases',
          'Relational databases: tables, records, fields and key fields',
          'Other database types such as NoSQL',
        ],
      },
      {
        code: '9.2',
        title: 'Creating a simple single-table database manually',
        periods: 2,
        subtopics: ['Field names and data types', 'Unique fields', 'Field size'],
      },
      {
        code: '9.3',
        title: 'Converting a manual database to electronic media',
        periods: 2,
        subtopics: ['Purpose of the database', 'Selecting suitable fields', 'Field properties'],
      },
      {
        code: '9.4',
        title: 'Relational database design',
        periods: 2,
        subtopics: ['Primary keys', 'Foreign keys', 'Relationships between tables'],
      },
      {
        code: '9.5',
        title: 'Using DBMS software',
        periods: 2,
        subtopics: ['Creating a database with multiple tables', 'Establishing relationships'],
      },
      {
        code: '9.6',
        title: 'Forms',
        periods: 2,
        subtopics: ['Form design', 'Form properties', 'Inserting controls'],
      },
      {
        code: '9.7',
        title: 'Queries',
        periods: 2,
        subtopics: ['Designing queries with the query tool', 'Using criteria', 'Sorting records'],
      },
      {
        code: '9.8',
        title: 'Reports',
        periods: 2,
        subtopics: ['The report wizard', 'Printing reports'],
      },
    ],
  },

  /* ---------------- GRADE 11 ---------------- */
  {
    code: '10',
    title: 'Programming',
    grade: 11,
    topics: [
      {
        code: '10.1',
        title: 'Analysing a problem',
        periods: null,
        subtopics: ['Identifying input, process and output', 'Finding alternative solutions'],
      },
      {
        code: '10.2',
        title: 'Problem solving using algorithms',
        periods: null,
        subtopics: ['What an algorithm is', 'Properties of a good algorithm'],
      },
      {
        code: '10.3',
        title: 'Representing an algorithm',
        periods: null,
        subtopics: [
          'Flowchart symbols',
          'Drawing flowcharts',
          'Writing pseudocode',
          'Converting between flowcharts and pseudocode',
          'Control structures: sequence, selection and repetition',
        ],
      },
      {
        code: '10.4',
        title: 'Programming in Pascal',
        periods: null,
        subtopics: [
          'Identifiers and reserved words',
          'Variables and constants',
          'Data types',
          'Operators',
          'Selection statements',
          'Repetition statements',
          'Nested control structures',
          'Arrays',
        ],
      },
      {
        code: '10.5',
        title: 'Evolution of programming languages',
        periods: null,
        subtopics: [
          'Machine language',
          'Assembly language',
          'High-level languages',
          'Compilers and interpreters',
        ],
      },
    ],
  },
  {
    code: '11',
    title: 'System development life cycle',
    grade: 11,
    topics: [
      {
        code: '11.1',
        title: 'The concept of information systems',
        periods: null,
        subtopics: [
          'What a system is',
          'Interactions among system components',
          'Manual versus computer-based information systems',
          'Why a new system becomes necessary',
        ],
      },
      {
        code: '11.2',
        title: 'System development processes',
        periods: null,
        subtopics: [
          'Requirement identification and analysis',
          'System design',
          'Development',
          'Testing: unit, integration, system and acceptance',
          'Deployment and maintenance',
          'Life cycle models',
        ],
      },
    ],
  },
  {
    code: '12',
    title: 'The internet and electronic mail',
    grade: 11,
    topics: [
      {
        code: '12.1',
        title: 'The internet',
        periods: null,
        subtopics: [
          'Introduction to the internet',
          'URLs',
          'Domain names',
          'How the internet works',
          'Services of the internet',
          'Remote access and file sharing',
          'Streaming media',
          'Search engines',
          'Domain name servers',
        ],
      },
      {
        code: '12.2',
        title: 'Electronic communication',
        periods: null,
        subtopics: [
          'Electronic mail',
          'Instant messaging',
          'Video conferencing',
          'Social networks',
        ],
      },
      {
        code: '12.3',
        title: 'Cloud computing',
        periods: null,
        subtopics: ['What cloud computing is', 'Cloud services', 'Benefits and concerns'],
      },
    ],
  },
  {
    code: '13',
    title: 'Multimedia',
    grade: 11,
    topics: [
      {
        code: '13.1',
        title: 'Digital graphics',
        periods: null,
        subtopics: [
          'Graphic size and resolution',
          'Lossy and lossless compression',
          'Raster and vector graphics',
          'Basics of graphic design',
        ],
      },
      {
        code: '13.2',
        title: 'Two-dimensional animation',
        periods: null,
        subtopics: [
          'Fundamentals of animation',
          'Geometric objects and shapes',
          'Types of frames',
          'Multimedia animation',
        ],
      },
      {
        code: '13.3',
        title: 'Audio content',
        periods: null,
        subtopics: ['Digital audio basics', 'Audio formats', 'Editing audio'],
      },
      {
        code: '13.4',
        title: 'Creating a video clip',
        periods: null,
        subtopics: ['Video capture', 'Video editing', 'Video formats and distribution'],
      },
    ],
  },
  {
    code: '14',
    title: 'Web design',
    grade: 11,
    topics: [
      {
        code: '14.1',
        title: 'Structuring information for the web',
        periods: null,
        subtopics: [
          'Web applications',
          'Web user groups',
          'Web content',
          'Content management',
          'Structure and layout',
          'Basic HTML',
        ],
      },
      {
        code: '14.2',
        title: 'Building a website',
        periods: null,
        subtopics: [
          'Web authoring tools',
          'Static and dynamic websites',
          'Content management systems',
        ],
      },
      {
        code: '14.3',
        title: 'Publishing a website',
        periods: null,
        subtopics: [
          'Choosing a web host',
          'Domain name registration',
          'File transfer protocol',
          'Website maintenance',
        ],
      },
    ],
  },
  {
    code: '15',
    title: 'ICT and society',
    grade: 11,
    topics: [
      {
        code: '15.1',
        title: 'ICT in entertainment and daily life',
        periods: null,
        subtopics: ['ICT in entertainment', 'ICT in everyday activities'],
      },
      {
        code: '15.2',
        title: 'Problems associated with the use of ICT',
        periods: null,
        subtopics: [
          'Health issues and ergonomics',
          'Computer crime and security',
          'Privacy concerns',
          'Ethical and social issues',
          'Environmental impact and e-waste',
        ],
      },
    ],
  },
];

/** Sanity figures, asserted by the seeder so a bad edit fails loudly. */
export const SYLLABUS_SHAPE = {
  units: 15,
  grade10Units: 9,
  grade11Units: 6,
  /** Grade 10 total teaching periods, per the Teacher's Guide. */
  grade10Periods: 90,
} as const;
