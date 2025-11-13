// Enhanced track seeding with 21 tracks (7 game types × 3 difficulty levels)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive track seeding with prerequisites...');
  
  // Find an IT Professional user to be the creator
  const itProfessional = await prisma.user.findFirst({
    where: { role: 'IT Professional' }
  });
  
  const creatorId = itProfessional?.id || null;
  
  // We'll store track IDs to set up prerequisites
  const trackIds = {};
  
  const tracks = [
    // ===== CODING GAME TRACKS (3 levels) =====
    {
      key: 'js-beginner',
      title: 'JavaScript Fundamentals',
      description: 'Master the basics of JavaScript programming with hands-on coding exercises. Learn variables, data types, arrays, and functions.',
      difficulty: 'Beginner',
      category: 'Programming',
      creatorId,
      prerequisites: null,
    {
      title: 'JavaScript Fundamentals',
      description: 'Master the basics of JavaScript programming with hands-on exercises and interactive games.',
      difficulty: 'Beginner',
      category: 'Programming',
      creatorId,
      modules: [
        {
          title: 'Variables and Data Types',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Introduction to Variables',
              order: 1,
              content: {
                subtitle: 'Understanding JavaScript Variables',
                body: 'Variables are containers for storing data values. In JavaScript, we can declare variables using var, let, or const. Each has its own scope and use cases.\n\nLet is used for variables that can change:\nlet age = 25;\nage = 26; // This works\n\nConst is for constants that should not change:\nconst pi = 3.14159;\n// pi = 3.14; // This would cause an error',
                resources: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types'],
                estimatedMins: 15
              }
            },
            {
              title: 'Data Types in JavaScript',
              order: 2,
              content: {
                subtitle: 'Primitive and Complex Data Types',
                body: 'JavaScript has several data types:\n\nPrimitive Types:\n- String: "Hello World"\n- Number: 42, 3.14\n- Boolean: true, false\n- Undefined: undefined\n- Null: null\n\nComplex Types:\n- Object: { name: "John", age: 30 }\n- Array: [1, 2, 3, 4, 5]\n\nYou can check types using typeof:\ntypeof "hello" // "string"\ntypeof 42 // "number"',
                resources: ['https://javascript.info/types'],
                estimatedMins: 20
              }
            }
          ]
        },
        {
          title: 'Arrays and Functions',
          type: 'lesson',
          order: 2,
          lessons: [
            {
              title: 'Working with Arrays',
              order: 1,
              content: {
                subtitle: 'Array Basics and Methods',
                body: 'Arrays are ordered collections of data. They can hold any type of value.\n\nCreating arrays:\nconst fruits = ["apple", "banana", "orange"];\nconst numbers = [1, 2, 3, 4, 5];\n\nCommon array methods:\n- push(): Add to end\n- pop(): Remove from end\n- shift(): Remove from start\n- unshift(): Add to start\n- length: Get array size\n\nExample:\nfruits.push("grape"); // ["apple", "banana", "orange", "grape"]\nfruits[0]; // "apple"',
                resources: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array'],
                estimatedMins: 25
              }
            },
            {
              title: 'Functions Fundamentals',
              order: 2,
              content: {
                subtitle: 'Creating and Using Functions',
                body: 'Functions are reusable blocks of code that perform specific tasks.\n\nFunction declaration:\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nArrow functions (ES6):\nconst greet = (name) => "Hello, " + name + "!";\n\nCalling functions:\nconst message = greet("Alice");\nconsole.log(message); // "Hello, Alice!"\n\nFunctions can take parameters and return values.',
                resources: ['https://javascript.info/function-basics'],
                estimatedMins: 20
              }
            }
          ]
        },
        {
          title: 'Coding Challenges',
          type: 'game',
          order: 3,
          games: [
            {
              name: 'Array Sum Challenge',
              type: 'coding',
              order: 1,
              content: {
                challengeId: 'array-sum',
                description: 'Write a function that returns the sum of all numbers in an array.',
                starterCode: 'function sumArray(arr) {\n  // Your code here\n  // Example: sumArray([1,2,3]) should return 6\n  \n}'
              }
            },
            {
              name: 'String Reverser',
              type: 'coding',
              order: 2,
              content: {
                challengeId: 'reverse-string',
                description: 'Write a function that reverses a string.',
                starterCode: 'function reverseString(str) {\n  // Your code here\n  // Example: reverseString("hello") should return "olleh"\n  \n}'
              }
            }
          ]
        }
      ]
    },
    {
      title: 'Web Development Basics',
      description: 'Learn HTML, CSS, and basic web design principles to build beautiful websites.',
      difficulty: 'Beginner',
      category: 'Web Development',
      creatorId,
      modules: [
        {
          title: 'HTML Fundamentals',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'HTML Structure',
              order: 1,
              content: {
                subtitle: 'Building Blocks of Web Pages',
                body: 'HTML (HyperText Markup Language) is the standard markup language for web pages.\n\nBasic HTML structure:\n<!DOCTYPE html>\n<html>\n  <head>\n    <title>My Page</title>\n  </head>\n  <body>\n    <h1>Welcome</h1>\n    <p>This is a paragraph.</p>\n  </body>\n</html>\n\nCommon tags:\n- <h1> to <h6>: Headings\n- <p>: Paragraphs\n- <a>: Links\n- <img>: Images\n- <div>: Containers',
                resources: ['https://developer.mozilla.org/en-US/docs/Web/HTML'],
                estimatedMins: 30
              }
            }
          ]
        },
        {
          title: 'CSS Styling',
          type: 'lesson',
          order: 2,
          lessons: [
            {
              title: 'CSS Basics',
              order: 1,
              content: {
                subtitle: 'Styling Your Web Pages',
                body: 'CSS (Cascading Style Sheets) controls the appearance of HTML elements.\n\nBasic syntax:\nselector {\n  property: value;\n}\n\nExample:\nh1 {\n  color: blue;\n  font-size: 24px;\n  text-align: center;\n}\n\nSelectors:\n- Element: h1, p, div\n- Class: .my-class\n- ID: #my-id\n\nThe box model: margin, border, padding, content',
                resources: ['https://developer.mozilla.org/en-US/docs/Web/CSS'],
                estimatedMins: 25
              }
            }
          ]
        },
        {
          title: 'Web Design Quiz',
          type: 'game',
          order: 3,
          games: [
            {
              name: 'HTML & CSS Trivia',
              type: 'trivia',
              order: 1,
              content: {
                questions: [
                  {
                    question: 'What does HTML stand for?',
                    options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language'],
                    correct: 0
                  },
                  {
                    question: 'Which CSS property controls text color?',
                    options: ['text-color', 'font-color', 'color'],
                    correct: 2
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      title: 'Network Fundamentals',
      description: 'Understand networking concepts, protocols, and how to design network topologies.',
      difficulty: 'Intermediate',
      category: 'Networking',
      creatorId,
      modules: [
        {
          title: 'Network Basics',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Introduction to Networking',
              order: 1,
              content: {
                subtitle: 'Understanding Computer Networks',
                body: 'A computer network is a group of interconnected devices that can communicate and share resources.\n\nTypes of networks:\n- LAN (Local Area Network): Small area like home/office\n- WAN (Wide Area Network): Large geographical area\n- MAN (Metropolitan Area Network): City-wide network\n\nNetwork devices:\n- Router: Connects different networks\n- Switch: Connects devices in a network\n- Hub: Basic connection point\n- Modem: Connects to internet',
                resources: ['https://www.cisco.com/c/en/us/solutions/small-business/resource-center/networking/networking-basics.html'],
                estimatedMins: 20
              }
            },
            {
              title: 'IP Addresses and Protocols',
              order: 2,
              content: {
                subtitle: 'Network Communication Fundamentals',
                body: 'IP addresses uniquely identify devices on a network.\n\nIPv4 format: 192.168.1.1\nIPv6 format: 2001:0db8:85a3:0000:0000:8a2e:0370:7334\n\nCommon protocols:\n- TCP (Transmission Control Protocol): Reliable, connection-based\n- UDP (User Datagram Protocol): Fast, connectionless\n- HTTP/HTTPS: Web traffic\n- FTP: File transfers\n- DNS: Domain name resolution\n\nPort numbers identify specific services on a device.',
                resources: ['https://www.cloudflare.com/learning/network-layer/what-is-a-protocol/'],
                estimatedMins: 25
              }
            }
          ]
        },
        {
          title: 'Network Design',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Build Your Network',
              type: 'network',
              order: 1,
              content: {
                challengeId: 'simple-lan',
                description: 'Design a simple LAN network connecting 5 computers using a switch and router.',
                requiredDevices: ['router', 'switch', 'computer'],
                minComputers: 5
              }
            }
          ]
        }
      ]
    },
    {
      title: 'Cybersecurity Essentials',
      description: 'Learn to identify threats, protect systems, and understand security best practices.',
      difficulty: 'Intermediate',
      category: 'Security',
      creatorId,
      modules: [
        {
          title: 'Security Fundamentals',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Introduction to Cybersecurity',
              order: 1,
              content: {
                subtitle: 'Protecting Digital Assets',
                body: 'Cybersecurity is the practice of protecting systems, networks, and data from digital attacks.\n\nThe CIA Triad:\n- Confidentiality: Only authorized access\n- Integrity: Data remains accurate and unaltered\n- Availability: Systems accessible when needed\n\nCommon threats:\n- Malware: Viruses, trojans, ransomware\n- Phishing: Fraudulent emails/messages\n- Social Engineering: Manipulating people\n- DDoS: Overwhelming systems with traffic\n\nBasic protection: Strong passwords, 2FA, updates, backups',
                resources: ['https://www.cisa.gov/cybersecurity'],
                estimatedMins: 30
              }
            }
          ]
        },
        {
          title: 'Threat Detection',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Spot the Phishing Email',
              type: 'threat',
              order: 1,
              content: {
                challengeId: 'phishing-detection',
                description: 'Analyze emails and identify which ones are phishing attempts.',
                scenarios: [
                  {
                    type: 'email',
                    content: 'Your account has been compromised. Click here to verify immediately!',
                    isPhishing: true
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      title: 'Database Design with SQL',
      description: 'Master SQL queries, database design, and data management techniques.',
      difficulty: 'Intermediate',
      category: 'Database',
      creatorId,
      modules: [
        {
          title: 'SQL Basics',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Introduction to Databases',
              order: 1,
              content: {
                subtitle: 'Understanding Relational Databases',
                body: 'A database is an organized collection of data stored electronically.\n\nRelational databases use tables with rows and columns:\n- Table: Collection of related data (e.g., Users, Products)\n- Row: Single record\n- Column: Attribute of the record\n- Primary Key: Unique identifier\n- Foreign Key: Links to another table\n\nSQL (Structured Query Language) is used to interact with databases.\n\nBasic operations (CRUD):\n- CREATE: Add new data\n- READ: Retrieve data\n- UPDATE: Modify data\n- DELETE: Remove data',
                resources: ['https://www.w3schools.com/sql/'],
                estimatedMins: 25
              }
            },
            {
              title: 'SQL Queries',
              order: 2,
              content: {
                subtitle: 'Writing Your First Queries',
                body: 'Basic SQL commands:\n\nSELECT - Retrieve data:\nSELECT * FROM users;\nSELECT name, email FROM users WHERE age > 18;\n\nINSERT - Add data:\nINSERT INTO users (name, email) VALUES ("John", "john@example.com");\n\nUPDATE - Modify data:\nUPDATE users SET age = 25 WHERE id = 1;\n\nDELETE - Remove data:\nDELETE FROM users WHERE id = 1;\n\nJOINS combine data from multiple tables.',
                resources: ['https://www.sqltutorial.org/'],
                estimatedMins: 30
              }
            }
          ]
        },
        {
          title: 'SQL Challenge',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Query Writing Challenge',
              type: 'sql-quiz',
              order: 1,
              content: {
                challengeId: 'basic-queries',
                description: 'Write SQL queries to solve database problems.',
                questions: [
                  {
                    question: 'Select all users from the users table',
                    correctAnswer: 'SELECT * FROM users;'
                  },
                  {
                    question: 'Find users older than 21',
                    correctAnswer: 'SELECT * FROM users WHERE age > 21;'
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      title: 'Python Programming',
      description: 'Learn Python from scratch with practical examples and coding exercises.',
      difficulty: 'Beginner',
      category: 'Programming',
      creatorId,
      modules: [
        {
          title: 'Python Basics',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Getting Started with Python',
              order: 1,
              content: {
                subtitle: 'Your First Python Program',
                body: 'Python is a versatile, beginner-friendly programming language.\n\nBasic syntax:\nprint("Hello, World!")\n\nVariables:\nname = "Alice"\nage = 25\nheight = 5.6\n\nData types:\n- int: 42\n- float: 3.14\n- str: "Hello"\n- bool: True, False\n- list: [1, 2, 3]\n- dict: {"key": "value"}\n\nPython uses indentation for code blocks (no curly braces).',
                resources: ['https://docs.python.org/3/tutorial/'],
                estimatedMins: 20
              }
            },
            {
              title: 'Control Flow',
              order: 2,
              content: {
                subtitle: 'If Statements and Loops',
                body: 'Control flow determines the order of code execution.\n\nIf statements:\nif age >= 18:\n    print("Adult")\nelse:\n    print("Minor")\n\nFor loops:\nfor i in range(5):\n    print(i)  # 0, 1, 2, 3, 4\n\nWhile loops:\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n\nList comprehension:\nsquares = [x**2 for x in range(10)]',
                resources: ['https://realpython.com/python-conditional-statements/'],
                estimatedMins: 25
              }
            }
          ]
        },
        {
          title: 'Python Challenges',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'FizzBuzz Challenge',
              type: 'coding',
              order: 1,
              content: {
                challengeId: 'fizzbuzz',
                description: 'Write a program that prints numbers 1-100. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", and for multiples of both print "FizzBuzz".',
                starterCode: 'def fizzbuzz():\n    # Your code here\n    pass'
              }
            }
          ]
        }
      ]
    }
  ];

  console.log(`📦 Creating ${tracks.length} tracks with modules, lessons, and games...`);

  for (const trackData of tracks) {
    const { modules, ...trackInfo } = trackData;
    
    const track = await prisma.track.create({
      data: trackInfo
    });
    
    console.log(`✅ Created track: ${track.title} (${track.difficulty})`);

    if (modules && modules.length > 0) {
      for (const moduleData of modules) {
        const { lessons, games, ...moduleInfo } = moduleData;
        
        const module = await prisma.module.create({
          data: {
            ...moduleInfo,
            trackId: track.id
          }
        });
        
        console.log(`  📚 Created module: ${module.title}`);

        // Create lessons if any
        if (lessons && lessons.length > 0) {
          for (const lessonData of lessons) {
            const lesson = await prisma.lesson.create({
              data: {
                ...lessonData,
                moduleId: module.id
              }
            });
            console.log(`    📖 Created lesson: ${lesson.title}`);
          }
        }

        // Create games if any
        if (games && games.length > 0) {
          for (const gameData of games) {
            const game = await prisma.game.create({
              data: {
                ...gameData,
                moduleId: module.id,
                trackId: track.id
              }
            });
            console.log(`    🎮 Created game: ${game.name} (${game.type})`);
          }
        }
      }
    }
  }

  console.log(`\n🎉 Enhanced track seeding completed!`);
  console.log(`📊 Summary:`);
  console.log(`   - Total tracks: ${tracks.length}`);
  console.log(`   - Each track includes: modules, lessons, and games`);
  console.log(`   - Categories: Programming, Web Development, Networking, Security, Database`);
}

main()
  .catch((e) => {
    console.error('Error seeding tracks:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
