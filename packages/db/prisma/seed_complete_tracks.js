// Comprehensive seed script for tracks with modules, lessons, and games
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting comprehensive track seeding...');

  // First, find or create an IT Professional user to be the track creator
  let itProfessional = await prisma.user.findFirst({
    where: { role: 'IT Professional' }
  });

  if (!itProfessional) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    itProfessional = await prisma.user.create({
      data: {
        name: 'IT Professional',
        email: 'itprof@example.com',
        password: hashedPassword,
        role: 'IT Professional'
      }
    });
    console.log('Created IT Professional user');
  }

  // Clear existing tracks to start fresh (optional - comment out if you want to keep existing data)
  console.log('Clearing existing tracks...');
  await prisma.game.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.trackProgress.deleteMany({});
  await prisma.track.deleteMany({});

  // Track 1: Web Development Fundamentals
  console.log('Creating Web Development track...');
  const webDevTrack = await prisma.track.create({
    data: {
      title: 'Web Development Fundamentals',
      description: 'Master the essentials of modern web development from HTML/CSS to JavaScript frameworks',
      difficulty: 'Beginner',
      category: 'web',
      creatorId: itProfessional.id,
      modules: {
        create: [
          {
            type: 'lesson',
            order: 1,
            content: { title: 'HTML & CSS Basics' },
            lessons: {
              create: [
                {
                  title: 'Introduction to HTML',
                  subtitle: 'Learn the building blocks of web pages',
                  body: {
                    sections: [
                      { type: 'text', content: 'HTML (HyperText Markup Language) is the standard markup language for creating web pages.' },
                      { type: 'code', language: 'html', content: '<h1>Hello World</h1>\n<p>This is a paragraph.</p>' },
                      { type: 'text', content: 'HTML elements are the building blocks of HTML pages.' }
                    ]
                  },
                  order: 1,
                  estimatedMins: 30
                },
                {
                  title: 'CSS Styling Basics',
                  subtitle: 'Make your web pages beautiful',
                  body: {
                    sections: [
                      { type: 'text', content: 'CSS (Cascading Style Sheets) is used to style HTML elements.' },
                      { type: 'code', language: 'css', content: 'h1 {\n  color: blue;\n  font-size: 24px;\n}' },
                      { type: 'text', content: 'CSS can control layout, colors, fonts, and more.' }
                    ]
                  },
                  order: 2,
                  estimatedMins: 45
                }
              ]
            },
            games: {
              create: [
                {
                  name: 'HTML Structure Challenge',
                  type: 'coding',
                  content: {
                    description: 'Create a simple HTML page with a header, paragraph, and list',
                    starterCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <!-- Add your HTML here -->\n</body>\n</html>',
                    expectedOutput: 'A valid HTML page with h1, p, and ul elements',
                    difficulty: 'beginner'
                  }
                }
              ]
            }
          },
          {
            type: 'lesson',
            order: 2,
            content: { title: 'JavaScript Fundamentals' },
            lessons: {
              create: [
                {
                  title: 'Variables and Data Types',
                  subtitle: 'Understanding JavaScript basics',
                  body: {
                    sections: [
                      { type: 'text', content: 'JavaScript variables can hold different types of data: strings, numbers, booleans, objects, and arrays.' },
                      { type: 'code', language: 'javascript', content: 'let name = "John";\nlet age = 25;\nlet isStudent = true;\nlet hobbies = ["coding", "gaming"];' },
                      { type: 'text', content: 'Use let for variables that change, and const for constants.' }
                    ]
                  },
                  order: 1,
                  estimatedMins: 40
                },
                {
                  title: 'Functions and Control Flow',
                  subtitle: 'Writing reusable code',
                  body: {
                    sections: [
                      { type: 'text', content: 'Functions are reusable blocks of code that perform specific tasks.' },
                      { type: 'code', language: 'javascript', content: 'function greet(name) {\n  return `Hello, ${name}!`;\n}\n\nif (age >= 18) {\n  console.log("Adult");\n} else {\n  console.log("Minor");\n}' }
                    ]
                  },
                  order: 2,
                  estimatedMins: 50
                }
              ]
            },
            games: {
              create: [
                {
                  name: 'JavaScript Calculator',
                  type: 'coding',
                  content: {
                    description: 'Create a function that adds two numbers and returns the result',
                    starterCode: 'function add(a, b) {\n  // Your code here\n}',
                    testCases: [
                      { input: [2, 3], expected: 5 },
                      { input: [10, 20], expected: 30 }
                    ],
                    difficulty: 'beginner'
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  // Track 2: Cybersecurity Essentials
  console.log('Creating Cybersecurity track...');
  const cyberTrack = await prisma.track.create({
    data: {
      title: 'Cybersecurity Essentials',
      description: 'Learn to protect systems and data from cyber threats',
      difficulty: 'Intermediate',
      category: 'security',
      creatorId: itProfessional.id,
      modules: {
        create: [
          {
            type: 'lesson',
            order: 1,
            content: { title: 'Introduction to Cybersecurity' },
            lessons: {
              create: [
                {
                  title: 'CIA Triad',
                  subtitle: 'Confidentiality, Integrity, Availability',
                  body: {
                    sections: [
                      { type: 'text', content: 'The CIA Triad is the foundation of information security.' },
                      { type: 'text', content: '• Confidentiality: Protecting data from unauthorized access\n• Integrity: Ensuring data accuracy and trustworthiness\n• Availability: Ensuring systems are accessible when needed' },
                      { type: 'image', url: 'https://example.com/cia-triad.png', alt: 'CIA Triad Diagram' }
                    ]
                  },
                  order: 1,
                  estimatedMins: 35
                },
                {
                  title: 'Common Threats',
                  subtitle: 'Understanding attack vectors',
                  body: {
                    sections: [
                      { type: 'text', content: 'Common cybersecurity threats include:' },
                      { type: 'list', items: [
                        'Phishing: Fraudulent emails to steal credentials',
                        'Malware: Malicious software (viruses, trojans, ransomware)',
                        'DDoS: Distributed Denial of Service attacks',
                        'SQL Injection: Exploiting database vulnerabilities',
                        'Man-in-the-Middle: Intercepting communications'
                      ]}
                    ]
                  },
                  order: 2,
                  estimatedMins: 40
                }
              ]
            },
            games: {
              create: [
                {
                  name: 'Threat Identification Challenge',
                  type: 'threat',
                  content: {
                    scenario: 'You receive an email from "support@paypa1.com" asking you to verify your account by clicking a link and entering your password. The email has poor grammar and creates urgency.',
                    question: 'Identify all security threats and explain why each is dangerous',
                    threats: ['Phishing', 'Social Engineering', 'Credential Theft'],
                    hints: [
                      'Look at the sender email domain carefully',
                      'Consider the urgency and request for credentials',
                      'Check for grammar and spelling errors'
                    ]
                  }
                }
              ]
            }
          },
          {
            type: 'lesson',
            order: 2,
            content: { title: 'Network Security' },
            lessons: {
              create: [
                {
                  title: 'Firewalls and Intrusion Detection',
                  subtitle: 'Protecting network perimeters',
                  body: {
                    sections: [
                      { type: 'text', content: 'Firewalls are the first line of defense in network security.' },
                      { type: 'text', content: 'Types of firewalls:\n1. Packet-filtering firewalls\n2. Stateful inspection firewalls\n3. Application-level gateways (proxy firewalls)\n4. Next-generation firewalls (NGFW)' }
                    ]
                  },
                  order: 1,
                  estimatedMins: 45
                }
              ]
            },
            games: {
              create: [
                {
                  name: 'Secure Network Design',
                  type: 'network',
                  content: {
                    description: 'Build a secure network topology with firewall, DMZ, and internal network',
                    requiredDevices: ['Firewall', 'Router', 'Switch', 'Server', 'Workstation'],
                    securityRequirements: [
                      'Firewall must be between internet and internal network',
                      'DMZ should isolate public-facing servers',
                      'Internal network should be behind firewall'
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  // Track 3: Database Administration
  console.log('Creating Database Administration track...');
  const dbTrack = await prisma.track.create({
    data: {
      title: 'Database Administration',
      description: 'Master database design, management, and optimization',
      difficulty: 'Intermediate',
      category: 'data',
      creatorId: itProfessional.id,
      modules: {
        create: [
          {
            type: 'lesson',
            order: 1,
            content: { title: 'SQL Fundamentals' },
            lessons: {
              create: [
                {
                  title: 'SELECT Queries',
                  subtitle: 'Retrieving data from databases',
                  body: {
                    sections: [
                      { type: 'text', content: 'The SELECT statement is used to query data from a database.' },
                      { type: 'code', language: 'sql', content: 'SELECT * FROM users;\nSELECT name, email FROM users WHERE age > 18;\nSELECT COUNT(*) FROM users;' },
                      { type: 'text', content: 'Use WHERE to filter results, ORDER BY to sort, and LIMIT to restrict rows.' }
                    ]
                  },
                  order: 1,
                  estimatedMins: 40
                },
                {
                  title: 'JOINs and Relationships',
                  subtitle: 'Combining data from multiple tables',
                  body: {
                    sections: [
                      { type: 'text', content: 'JOINs allow you to combine rows from two or more tables.' },
                      { type: 'code', language: 'sql', content: 'SELECT users.name, orders.total\nFROM users\nINNER JOIN orders ON users.id = orders.user_id;' },
                      { type: 'text', content: 'Types of JOINs: INNER, LEFT, RIGHT, FULL OUTER' }
                    ]
                  },
                  order: 2,
                  estimatedMins: 50
                }
              ]
            },
            games: {
              create: [
                {
                  name: 'SQL Query Challenge',
                  type: 'sql-quiz',
                  content: {
                    database: 'ecommerce',
                    tables: {
                      users: ['id', 'name', 'email', 'created_at'],
                      orders: ['id', 'user_id', 'total', 'status'],
                      products: ['id', 'name', 'price', 'stock']
                    },
                    questions: [
                      {
                        question: 'Write a query to select all users',
                        answer: 'SELECT * FROM users;',
                        points: 10
                      },
                      {
                        question: 'Write a query to count orders with status "completed"',
                        answer: 'SELECT COUNT(*) FROM orders WHERE status = "completed";',
                        points: 20
                      },
                      {
                        question: 'Write a query to join users and orders, showing user names and order totals',
                        answer: 'SELECT users.name, orders.total FROM users INNER JOIN orders ON users.id = orders.user_id;',
                        points: 30
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  // Track 4: Network Engineering
  console.log('Creating Network Engineering track...');
  const networkTrack = await prisma.track.create({
    data: {
      title: 'Network Engineering',
      description: 'Design and manage computer networks',
      difficulty: 'Intermediate',
      category: 'network',
      creatorId: itProfessional.id,
      modules: {
        create: [
          {
            type: 'lesson',
            order: 1,
            content: { title: 'Network Fundamentals' },
            lessons: {
              create: [
                {
                  title: 'OSI Model',
                  subtitle: 'Understanding network layers',
                  body: {
                    sections: [
                      { type: 'text', content: 'The OSI (Open Systems Interconnection) model has 7 layers:' },
                      { type: 'list', items: [
                        'Layer 7: Application (HTTP, FTP, SMTP)',
                        'Layer 6: Presentation (encryption, compression)',
                        'Layer 5: Session (session management)',
                        'Layer 4: Transport (TCP, UDP)',
                        'Layer 3: Network (IP, routing)',
                        'Layer 2: Data Link (MAC addresses, switches)',
                        'Layer 1: Physical (cables, signals)'
                      ]}
                    ]
                  },
                  order: 1,
                  estimatedMins: 45
                },
                {
                  title: 'TCP/IP Protocol Suite',
                  subtitle: 'The foundation of the internet',
                  body: {
                    sections: [
                      { type: 'text', content: 'TCP/IP is the communication protocol for the internet.' },
                      { type: 'text', content: 'Key protocols:\n• TCP: Reliable, connection-oriented\n• UDP: Fast, connectionless\n• IP: Addressing and routing\n• HTTP/HTTPS: Web communication' }
                    ]
                  },
                  order: 2,
                  estimatedMins: 40
                }
              ]
            },
            games: {
              create: [
                {
                  name: 'Build a Corporate Network',
                  type: 'network',
                  content: {
                    description: 'Design a network for a small office with 20 employees',
                    requirements: {
                      devices: ['Router', 'Switch', 'Firewall', 'Server', 'Workstations'],
                      minimumConnections: 5,
                      securityDevices: ['Firewall']
                    },
                    scoring: {
                      router: 30,
                      switch: 20,
                      firewall: 25,
                      connections: 15,
                      redundancy: 10
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  // Track 5: Software Development with Python
  console.log('Creating Python Software Development track...');
  const pythonTrack = await prisma.track.create({
    data: {
      title: 'Python Software Development',
      description: 'Build applications with Python from basics to advanced',
      difficulty: 'Beginner',
      category: 'programming',
      creatorId: itProfessional.id,
      modules: {
        create: [
          {
            type: 'lesson',
            order: 1,
            content: { title: 'Python Basics' },
            lessons: {
              create: [
                {
                  title: 'Python Syntax and Variables',
                  subtitle: 'Your first Python program',
                  body: {
                    sections: [
                      { type: 'text', content: 'Python is a high-level, interpreted programming language known for its simplicity.' },
                      { type: 'code', language: 'python', content: '# Variables\nname = "Alice"\nage = 25\nheight = 5.6\nis_student = True\n\n# Print\nprint(f"Hello, {name}!")' },
                      { type: 'text', content: 'Python uses indentation for code blocks instead of braces.' }
                    ]
                  },
                  order: 1,
                  estimatedMins: 35
                },
                {
                  title: 'Lists and Dictionaries',
                  subtitle: 'Working with data structures',
                  body: {
                    sections: [
                      { type: 'text', content: 'Lists and dictionaries are fundamental Python data structures.' },
                      { type: 'code', language: 'python', content: '# Lists\nfruits = ["apple", "banana", "cherry"]\nfruits.append("orange")\n\n# Dictionaries\nperson = {\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}\nprint(person["name"])' }
                    ]
                  },
                  order: 2,
                  estimatedMins: 40
                }
              ]
            },
            games: {
              create: [
                {
                  name: 'Python List Operations',
                  type: 'coding',
                  content: {
                    description: 'Write a function that finds the largest number in a list',
                    starterCode: 'def find_largest(numbers):\n    # Your code here\n    pass',
                    testCases: [
                      { input: [[1, 5, 3, 9, 2]], expected: 9 },
                      { input: [[10, 20, 30]], expected: 30 },
                      { input: [[-5, -1, -10]], expected: -1 }
                    ],
                    difficulty: 'beginner',
                    language: 'python'
                  }
                }
              ]
            }
          },
          {
            type: 'lesson',
            order: 2,
            content: { title: 'Functions and Modules' },
            lessons: {
              create: [
                {
                  title: 'Defining Functions',
                  subtitle: 'Creating reusable code',
                  body: {
                    sections: [
                      { type: 'text', content: 'Functions help you organize and reuse code.' },
                      { type: 'code', language: 'python', content: 'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\nresult = greet("Alice")\nprint(result)  # Hello, Alice!' }
                    ]
                  },
                  order: 1,
                  estimatedMins: 45
                }
              ]
            },
            games: {
              create: [
                {
                  name: 'Function Challenge',
                  type: 'coding',
                  content: {
                    description: 'Create a function that calculates the factorial of a number',
                    starterCode: 'def factorial(n):\n    # Your code here\n    pass',
                    testCases: [
                      { input: [5], expected: 120 },
                      { input: [3], expected: 6 },
                      { input: [0], expected: 1 }
                    ],
                    hints: ['Factorial of n = n * (n-1) * (n-2) * ... * 1', 'Factorial of 0 is 1'],
                    difficulty: 'intermediate',
                    language: 'python'
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('\n✅ Seeding completed successfully!');
  console.log('\nCreated tracks:');
  console.log('1. Web Development Fundamentals - 2 modules, 4 lessons, 2 games');
  console.log('2. Cybersecurity Essentials - 2 modules, 3 lessons, 2 games');
  console.log('3. Database Administration - 1 module, 2 lessons, 1 game');
  console.log('4. Network Engineering - 1 module, 2 lessons, 1 game');
  console.log('5. Python Software Development - 2 modules, 3 lessons, 2 games');
  console.log('\nTotal: 5 tracks, 8 modules, 14 lessons, 8 games');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
