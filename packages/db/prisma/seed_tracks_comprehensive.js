// Comprehensive track seeding: 21 tracks (7 game types × 3 difficulty levels)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive track seeding (21 tracks with prerequisites)...');
  
  // Find an IT Professional user to be the creator
  const itProfessional = await prisma.user.findFirst({
    where: { role: 'IT Professional' }
  });
  
  const creatorId = itProfessional?.id || null;
  const trackIds = {};
  
  const allTracks = [
    // ===== 1. CODING TRACKS (JavaScript) =====
    {
      key: 'js-beginner',
      title: 'JavaScript Programming Basics',
      description: 'Start your coding journey with JavaScript fundamentals. Learn variables, data types, arrays, and basic functions.',
      difficulty: 'Beginner',
      category: 'Programming',
      modules: [
        {
          title: 'JavaScript Fundamentals',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Variables and Data Types',
              order: 1,
              content: {
                subtitle: 'Understanding JavaScript Variables',
                body: 'Variables are containers for storing data values. In JavaScript, we use let, const, and var.\n\n**Let** - for values that change:\n```javascript\nlet age = 25;\nage = 26; // OK\n```\n\n**Const** - for constants:\n```javascript\nconst PI = 3.14159;\n// PI = 3.14; // Error!\n```\n\n**Data Types:**\n- String: "Hello"\n- Number: 42, 3.14\n- Boolean: true, false\n- Array: [1, 2, 3]\n- Object: {name: "John"}',
                resources: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types'],
                estimatedMins: 20
              }
            },
            {
              title: 'Functions Basics',
              order: 2,
              content: {
                subtitle: 'Creating Your First Functions',
                body: 'Functions are reusable blocks of code.\n\n**Function Declaration:**\n```javascript\nfunction greet(name) {\n  return "Hello, " + name;\n}\n```\n\n**Arrow Functions:**\n```javascript\nconst greet = (name) => "Hello, " + name;\n```\n\n**Calling Functions:**\n```javascript\nconst message = greet("Alice");\nconsole.log(message); // "Hello, Alice"\n```',
                resources: ['https://javascript.info/function-basics'],
                estimatedMins: 25
              }
            }
          ]
        },
        {
          title: 'Coding Challenges',
          type: 'game',
          order: 2,
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
            }
          ]
        }
      ]
    },
    {
      key: 'js-intermediate',
      title: 'JavaScript Intermediate Algorithms',
      description: 'Level up with advanced algorithms, array methods, and problem-solving techniques. Requires completion of JavaScript Basics.',
      difficulty: 'Intermediate',
      category: 'Programming',
      prerequisiteKeys: ['js-beginner'],
      modules: [
        {
          title: 'Advanced Array Operations',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Array Methods Deep Dive',
              order: 1,
              content: {
                subtitle: 'Master Modern Array Methods',
                body: '**Map** - Transform each element:\n```javascript\nconst numbers = [1, 2, 3];\nconst doubled = numbers.map(n => n * 2);\n// [2, 4, 6]\n```\n\n**Filter** - Select elements:\n```javascript\nconst ages = [15, 21, 18, 25];\nconst adults = ages.filter(age => age >= 18);\n// [21, 18, 25]\n```\n\n**Reduce** - Combine elements:\n```javascript\nconst nums = [1, 2, 3, 4];\nconst sum = nums.reduce((acc, n) => acc + n, 0);\n// 10\n```',
                resources: ['https://javascript.info/array-methods'],
                estimatedMins: 30
              }
            }
          ]
        },
        {
          title: 'Algorithm Challenges',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Fibonacci Sequence',
              type: 'coding',
              order: 1,
              content: {
                challengeId: 'fibonacci',
                description: 'Write a function that returns the nth Fibonacci number using recursion or iteration.',
                starterCode: 'function fibonacci(n) {\n  // Your code here\n  // fibonacci(5) should return 5\n  // Sequence: 0, 1, 1, 2, 3, 5...\n}'
              }
            }
          ]
        }
      ]
    },
    {
      key: 'js-advanced',
      title: 'JavaScript Advanced Patterns',
      description: 'Master complex data structures, design patterns, and optimization. Requires Intermediate level completion.',
      difficulty: 'Advanced',
      category: 'Programming',
      prerequisiteKeys: ['js-intermediate'],
      modules: [
        {
          title: 'Data Structures & Algorithms',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Sorting Algorithms',
              order: 1,
              content: {
                subtitle: 'Understanding Sort Complexity',
                body: '**Bubble Sort** - O(n²):\n```javascript\nfunction bubbleSort(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n      }\n    }\n  }\n  return arr;\n}\n```\n\n**Quick Sort** - O(n log n):\nDivide and conquer approach with pivot selection.',
                resources: ['https://www.geeksforgeeks.org/sorting-algorithms/'],
                estimatedMins: 40
              }
            }
          ]
        },
        {
          title: 'Advanced Coding Challenges',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Custom Sort Algorithm',
              type: 'coding',
              order: 1,
              content: {
                challengeId: 'custom-sort',
                description: 'Implement an efficient sorting algorithm (Quick Sort or Merge Sort).',
                starterCode: 'function customSort(arr) {\n  // Implement your sorting algorithm\n  // Return sorted array in ascending order\n}'
              }
            }
          ]
        }
      ]
    },

    // ===== 2. WEB DEVELOPMENT TRACKS =====
    {
      key: 'web-beginner',
      title: 'Web Development Basics',
      description: 'Learn HTML and CSS fundamentals to build beautiful web pages from scratch.',
      difficulty: 'Beginner',
      category: 'Web Development',
      modules: [
        {
          title: 'HTML Fundamentals',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'HTML Structure & Tags',
              order: 1,
              content: {
                subtitle: 'Building Blocks of Web Pages',
                body: '**Basic HTML Structure:**\n```html\n<!DOCTYPE html>\n<html>\n  <head>\n    <title>My Page</title>\n  </head>\n  <body>\n    <h1>Welcome!</h1>\n    <p>This is a paragraph.</p>\n  </body>\n</html>\n```\n\n**Common Tags:**\n- `<h1>` to `<h6>`: Headings\n- `<p>`: Paragraphs\n- `<a href="">`: Links\n- `<img src="">`: Images\n- `<div>`: Container\n- `<ul>`, `<li>`: Lists',
                resources: ['https://developer.mozilla.org/en-US/docs/Web/HTML'],
                estimatedMins: 25
              }
            },
            {
              title: 'CSS Styling Basics',
              order: 2,
              content: {
                subtitle: 'Making Web Pages Beautiful',
                body: '**CSS Syntax:**\n```css\nselector {\n  property: value;\n}\n```\n\n**Example:**\n```css\nh1 {\n  color: blue;\n  font-size: 32px;\n  text-align: center;\n}\n```\n\n**Selectors:**\n- Element: `h1`, `p`\n- Class: `.my-class`\n- ID: `#my-id`\n\n**Box Model:** margin → border → padding → content',
                resources: ['https://web.dev/learn/css/'],
                estimatedMins: 30
              }
            }
          ]
        },
        {
          title: 'Web Trivia Challenge',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'HTML & CSS Fundamentals Quiz',
              type: 'trivia',
              order: 1,
              content: {
                questions: [
                  {
                    question: 'What does HTML stand for?',
                    options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
                    correct: 0
                  },
                  {
                    question: 'Which CSS property controls text color?',
                    options: ['text-color', 'font-color', 'color', 'text-style'],
                    correct: 2
                  },
                  {
                    question: 'Which tag creates a hyperlink?',
                    options: ['<link>', '<a>', '<href>', '<url>'],
                    correct: 1
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      key: 'web-intermediate',
      title: 'Responsive Web Design',
      description: 'Master responsive layouts, flexbox, grid, and modern CSS techniques. Build mobile-friendly websites.',
      difficulty: 'Intermediate',
      category: 'Web Development',
      prerequisiteKeys: ['web-beginner'],
      modules: [
        {
          title: 'Responsive Design Principles',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Flexbox Layout',
              order: 1,
              content: {
                subtitle: 'Modern CSS Layouts Made Easy',
                body: '**Flexbox Container:**\n```css\n.container {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 20px;\n}\n```\n\n**Flex Items:**\n```css\n.item {\n  flex: 1; /* Grow to fill space */\n  flex-shrink: 0; /* Don\'t shrink */\n}\n```\n\n**Media Queries:**\n```css\n@media (max-width: 768px) {\n  .container {\n    flex-direction: column;\n  }\n}\n```',
                resources: ['https://css-tricks.com/snippets/css/a-guide-to-flexbox/'],
                estimatedMins: 35
              }
            }
          ]
        },
        {
          title: 'Web Design Quiz',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Responsive Design Trivia',
              type: 'trivia',
              order: 1,
              content: {
                questions: [
                  {
                    question: 'Which CSS property creates a flexbox container?',
                    options: ['flex-container', 'display: flex', 'flexbox: true', 'layout: flex'],
                    correct: 1
                  },
                  {
                    question: 'What unit is best for responsive font sizes?',
                    options: ['px', 'pt', 'rem', 'cm'],
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
      key: 'web-advanced',
      title: 'Advanced Web Technologies',
      description: 'Master animations, CSS Grid, preprocessors, and performance optimization for professional websites.',
      difficulty: 'Advanced',
      category: 'Web Development',
      prerequisiteKeys: ['web-intermediate'],
      modules: [
        {
          title: 'Advanced CSS Techniques',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'CSS Grid & Animations',
              order: 1,
              content: {
                subtitle: 'Professional Layout & Motion',
                body: '**CSS Grid:**\n```css\n.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 20px;\n}\n```\n\n**Animations:**\n```css\n@keyframes slideIn {\n  from { transform: translateX(-100%); }\n  to { transform: translateX(0); }\n}\n\n.element {\n  animation: slideIn 0.5s ease-out;\n}\n```\n\n**Performance:** Use `transform` and `opacity` for smooth 60fps animations.',
                resources: ['https://web.dev/animations/'],
                estimatedMins: 45
              }
            }
          ]
        },
        {
          title: 'Advanced Web Quiz',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'CSS Advanced Concepts',
              type: 'trivia',
              order: 1,
              content: {
                questions: [
                  {
                    question: 'Which properties trigger GPU acceleration?',
                    options: ['width, height', 'transform, opacity', 'color, background', 'margin, padding'],
                    correct: 1
                  }
                ]
              }
            }
          ]
        }
      ]
    },

    // ===== 3. NETWORK TRACKS =====
    {
      key: 'network-beginner',
      title: 'Networking Fundamentals',
      description: 'Understand basic networking concepts, devices, and simple network topologies.',
      difficulty: 'Beginner',
      category: 'Networking',
      modules: [
        {
          title: 'Network Basics',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Introduction to Networks',
              order: 1,
              content: {
                subtitle: 'Understanding Computer Networks',
                body: '**What is a Network?**\nA group of interconnected devices that share resources.\n\n**Network Types:**\n- **LAN** (Local Area Network): Home/office\n- **WAN** (Wide Area Network): Internet\n- **MAN** (Metropolitan): City-wide\n\n**Network Devices:**\n- **Router**: Connects networks\n- **Switch**: Connects devices\n- **Hub**: Basic connector\n- **Modem**: Internet gateway\n\n**Topology:** Star, Bus, Ring, Mesh',
                resources: ['https://www.cisco.com/c/en/us/solutions/small-business/resource-center/networking/networking-basics.html'],
                estimatedMins: 25
              }
            }
          ]
        },
        {
          title: 'Network Design Challenge',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Build a Simple LAN',
              type: 'network',
              order: 1,
              content: {
                challengeId: 'simple-lan',
                description: 'Design a basic LAN connecting 5 computers using a switch.',
                requiredDevices: ['switch', 'computer'],
                minComputers: 5
              }
            }
          ]
        }
      ]
    },
    {
      key: 'network-intermediate',
      title: 'Network Engineering',
      description: 'Learn subnetting, VLANs, routing protocols, and design complex networks.',
      difficulty: 'Intermediate',
      category: 'Networking',
      prerequisiteKeys: ['network-beginner'],
      modules: [
        {
          title: 'IP Addressing & Subnetting',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Subnetting Fundamentals',
              order: 1,
              content: {
                subtitle: 'Dividing Networks Efficiently',
                body: '**IP Address Structure:**\nIPv4: 192.168.1.1 (32 bits)\n\n**Subnet Mask:**\n255.255.255.0 = /24\n- Network portion: First 24 bits\n- Host portion: Last 8 bits\n- Hosts available: 2^8 - 2 = 254\n\n**CIDR Notation:**\n- /24 = 255.255.255.0\n- /16 = 255.255.0.0\n- /8 = 255.0.0.0\n\n**Subnetting Example:**\n192.168.1.0/24 → divide into 4 subnets:\n- 192.168.1.0/26 (64 hosts)\n- 192.168.1.64/26\n- 192.168.1.128/26\n- 192.168.1.192/26',
                resources: ['https://www.cloudflare.com/learning/network-layer/what-is-a-subnet/'],
                estimatedMins: 35
              }
            }
          ]
        },
        {
          title: 'Complex Network Design',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Multi-Subnet Network',
              type: 'network',
              order: 1,
              content: {
                challengeId: 'multi-subnet',
                description: 'Design a network with multiple subnets, VLANs, and inter-VLAN routing.',
                requiredDevices: ['router', 'switch', 'computer', 'server'],
                minComputers: 10
              }
            }
          ]
        }
      ]
    },
    {
      key: 'network-advanced',
      title: 'Enterprise Network Architecture',
      description: 'Design enterprise-grade networks with redundancy, security, and performance optimization.',
      difficulty: 'Advanced',
      category: 'Networking',
      prerequisiteKeys: ['network-intermediate'],
      modules: [
        {
          title: 'Enterprise Network Design',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'High Availability Networks',
              order: 1,
              content: {
                subtitle: 'Redundancy & Failover',
                body: '**High Availability Concepts:**\n\n**Redundancy:**\n- Dual routers (VRRP, HSRP)\n- Multiple switches (STP)\n- Load balancing\n\n**Protocols:**\n- **OSPF**: Dynamic routing\n- **BGP**: Internet routing\n- **STP**: Loop prevention\n\n**Design Principles:**\n- Core/Distribution/Access layers\n- Redundant links\n- QoS for critical traffic\n- Network segmentation',
                resources: ['https://www.cisco.com/c/en/us/solutions/enterprise-networks/'],
                estimatedMins: 45
              }
            }
          ]
        },
        {
          title: 'Enterprise Challenge',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Enterprise Network Design',
              type: 'network',
              order: 1,
              content: {
                challengeId: 'enterprise-network',
                description: 'Design a full enterprise network with core, distribution, and access layers, including redundancy.',
                requiredDevices: ['router', 'switch', 'firewall', 'server', 'computer'],
                minComputers: 20
              }
            }
          ]
        }
      ]
    },

    // ===== 4. CYBERSECURITY TRACKS =====
    {
      key: 'security-beginner',
      title: 'Cybersecurity Basics',
      description: 'Learn security fundamentals, common threats, and how to protect yourself online.',
      difficulty: 'Beginner',
      category: 'Security',
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
                body: '**The CIA Triad:**\n\n**Confidentiality:**\nOnly authorized users access data\n- Encryption\n- Access controls\n- Authentication\n\n**Integrity:**\nData remains accurate\n- Checksums\n- Digital signatures\n- Version control\n\n**Availability:**\nSystems accessible when needed\n- Redundancy\n- Backups\n- DDoS protection\n\n**Common Threats:**\n- Malware, Phishing, Social Engineering, DDoS',
                resources: ['https://www.cisa.gov/cybersecurity'],
                estimatedMins: 25
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
                description: 'Analyze emails and identify phishing attempts based on suspicious indicators.',
                scenarios: [
                  {
                    type: 'email',
                    content: 'URGENT: Your account has been compromised! Click here to verify immediately!',
                    isPhishing: true,
                    indicators: ['urgency', 'suspicious link', 'fear tactics']
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      key: 'security-intermediate',
      title: 'Network Security',
      description: 'Master firewalls, IDS/IPS, VPNs, and network security monitoring.',
      difficulty: 'Intermediate',
      category: 'Security',
      prerequisiteKeys: ['security-beginner'],
      modules: [
        {
          title: 'Network Security Tools',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Firewalls & Access Control',
              order: 1,
              content: {
                subtitle: 'Network Defense Mechanisms',
                body: '**Firewall Types:**\n\n**Packet Filter:**\nInspects packet headers\n- Source/Destination IP\n- Ports\n- Protocol\n\n**Stateful Inspection:**\nTracks connection state\n- Session awareness\n- Better security\n\n**Application Layer:**\nInspects packet contents\n- Deep packet inspection\n- Protocol validation\n\n**IDS vs IPS:**\n- IDS: Detects and alerts\n- IPS: Detects and blocks',
                resources: ['https://www.cloudflare.com/learning/security/what-is-a-firewall/'],
                estimatedMins: 30
              }
            }
          ]
        },
        {
          title: 'Security Incident Analysis',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Network Attack Analysis',
              type: 'threat',
              order: 1,
              content: {
                challengeId: 'network-attack',
                description: 'Analyze network traffic logs to identify attack patterns and compromised systems.',
                scenarios: [
                  {
                    type: 'network-log',
                    content: 'Multiple failed SSH login attempts from 203.0.113.1',
                    isPhishing: false,
                    attackType: 'brute-force'
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      key: 'security-advanced',
      title: 'Advanced Threat Detection',
      description: 'Master APT detection, forensics, and incident response for enterprise security.',
      difficulty: 'Advanced',
      category: 'Security',
      prerequisiteKeys: ['security-intermediate'],
      modules: [
        {
          title: 'Advanced Persistent Threats',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'APT Detection & Response',
              order: 1,
              content: {
                subtitle: 'Identifying Sophisticated Attacks',
                body: '**APT Characteristics:**\n- Long-term persistence\n- Targeted attacks\n- Multiple attack vectors\n- Advanced evasion\n\n**Detection Methods:**\n- Behavioral analysis\n- Anomaly detection\n- Threat intelligence\n- SIEM correlation\n\n**Incident Response:**\n1. Preparation\n2. Detection & Analysis\n3. Containment\n4. Eradication\n5. Recovery\n6. Lessons Learned\n\n**Forensics:** Preserve evidence, analyze artifacts, timeline reconstruction',
                resources: ['https://www.sans.org/white-papers/'],
                estimatedMins: 45
              }
            }
          ]
        },
        {
          title: 'APT Investigation',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Advanced Threat Investigation',
              type: 'threat',
              order: 1,
              content: {
                challengeId: 'apt-investigation',
                description: 'Investigate a complex APT scenario, identify compromise indicators, and recommend remediation.',
                scenarios: [
                  {
                    type: 'apt',
                    content: 'Multiple systems showing unusual outbound connections to the same IP',
                    indicators: ['C2 communication', 'lateral movement', 'data exfiltration']
                  }
                ]
              }
            }
          ]
        }
      ]
    },

    // ===== 5. DATABASE/SQL TRACKS =====
    {
      key: 'sql-beginner',
      title: 'SQL Fundamentals',
      description: 'Learn database basics and write your first SQL queries for data retrieval.',
      difficulty: 'Beginner',
      category: 'Database',
      modules: [
        {
          title: 'Database Basics',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Introduction to Databases',
              order: 1,
              content: {
                subtitle: 'Understanding Relational Databases',
                body: '**Database Concepts:**\n\n**Table:** Collection of related data\n- Rows: Records\n- Columns: Attributes\n\n**Keys:**\n- **Primary Key:** Unique identifier\n- **Foreign Key:** Links to another table\n\n**Basic SQL Commands:**\n```sql\nSELECT * FROM users;\nSELECT name, email FROM users WHERE age > 18;\n```\n\n**Operators:**\n- `=`, `!=`, `>`, `<`, `>=`, `<=`\n- `AND`, `OR`, `NOT`\n- `LIKE`, `IN`, `BETWEEN`',
                resources: ['https://www.w3schools.com/sql/'],
                estimatedMins: 25
              }
            }
          ]
        },
        {
          title: 'SQL Query Challenge',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Basic SQL Queries',
              type: 'sql-quiz',
              order: 1,
              content: {
                challengeId: 'basic-sql',
                description: 'Write SQL queries to retrieve data from a users table.',
                questions: [
                  {
                    question: 'Select all columns from the users table',
                    correctAnswer: 'SELECT * FROM users;',
                    hint: 'Use SELECT with asterisk'
                  },
                  {
                    question: 'Find all users older than 21',
                    correctAnswer: 'SELECT * FROM users WHERE age > 21;',
                    hint: 'Use WHERE clause with comparison'
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      key: 'sql-intermediate',
      title: 'SQL Joins & Aggregations',
      description: 'Master JOINs, GROUP BY, aggregate functions, and complex queries.',
      difficulty: 'Intermediate',
      category: 'Database',
      prerequisiteKeys: ['sql-beginner'],
      modules: [
        {
          title: 'Advanced SQL Operations',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'JOINs and Relationships',
              order: 1,
              content: {
                subtitle: 'Combining Data from Multiple Tables',
                body: '**JOIN Types:**\n\n**INNER JOIN:**\n```sql\nSELECT users.name, orders.total\nFROM users\nINNER JOIN orders ON users.id = orders.user_id;\n```\n\n**LEFT JOIN:**\n```sql\nSELECT users.name, orders.total\nFROM users\nLEFT JOIN orders ON users.id = orders.user_id;\n```\n\n**Aggregate Functions:**\n```sql\nSELECT COUNT(*), AVG(age), SUM(salary)\nFROM users\nGROUP BY department\nHAVING COUNT(*) > 10;\n```',
                resources: ['https://www.sqltutorial.org/sql-join/'],
                estimatedMins: 35
              }
            }
          ]
        },
        {
          title: 'Advanced Query Challenge',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'SQL Joins & Aggregations',
              type: 'sql-quiz',
              order: 1,
              content: {
                challengeId: 'sql-joins',
                description: 'Write complex queries using JOINs and aggregate functions.',
                questions: [
                  {
                    question: 'Join users and orders tables, show user names and order totals',
                    correctAnswer: 'SELECT users.name, orders.total FROM users INNER JOIN orders ON users.id = orders.user_id;',
                    hint: 'Use INNER JOIN with ON clause'
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      key: 'sql-advanced',
      title: 'SQL Optimization & Design',
      description: 'Master query optimization, indexing, transactions, and database design patterns.',
      difficulty: 'Advanced',
      category: 'Database',
      prerequisiteKeys: ['sql-intermediate'],
      modules: [
        {
          title: 'Performance & Optimization',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Query Optimization Techniques',
              order: 1,
              content: {
                subtitle: 'Making Queries Lightning Fast',
                body: '**Indexing:**\n```sql\nCREATE INDEX idx_users_email ON users(email);\nCREATE UNIQUE INDEX idx_users_username ON users(username);\n```\n\n**Query Analysis:**\n```sql\nEXPLAIN ANALYZE SELECT * FROM users WHERE email = \'test@example.com\';\n```\n\n**Optimization Tips:**\n- Use indexes on WHERE/JOIN columns\n- Avoid SELECT *\n- Use LIMIT for pagination\n- Denormalize when needed\n- Use covering indexes\n\n**Transactions:**\n```sql\nBEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;\n```',
                resources: ['https://use-the-index-luke.com/'],
                estimatedMins: 45
              }
            }
          ]
        },
        {
          title: 'Advanced SQL Challenge',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Query Optimization Challenge',
              type: 'sql-quiz',
              order: 1,
              content: {
                challengeId: 'sql-optimization',
                description: 'Optimize slow queries and design efficient database schemas.',
                questions: [
                  {
                    question: 'Create an index on the email column of users table',
                    correctAnswer: 'CREATE INDEX idx_users_email ON users(email);',
                    hint: 'Use CREATE INDEX'
                  }
                ]
              }
            }
          ]
        }
      ]
    },

    // ===== 6. LOGIC/PUZZLE TRACKS =====
    {
      key: 'logic-beginner',
      title: 'Logic & Pattern Recognition',
      description: 'Develop logical thinking skills with pattern recognition and sequence puzzles.',
      difficulty: 'Beginner',
      category: 'Logic',
      modules: [
        {
          title: 'Pattern Recognition',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Understanding Patterns',
              order: 1,
              content: {
                subtitle: 'Training Your Brain to See Patterns',
                body: '**Types of Patterns:**\n\n**Numerical Sequences:**\n- Arithmetic: 2, 4, 6, 8... (+2)\n- Geometric: 2, 4, 8, 16... (×2)\n- Fibonacci: 1, 1, 2, 3, 5, 8...\n\n**Visual Patterns:**\n- Shapes: ○, □, △, ○, □, ?\n- Colors: Red, Blue, Red, Blue, ?\n\n**Logic Patterns:**\n- If A>B and B>C, then A>C\n- All squares are rectangles\n- Find the odd one out\n\n**Problem-Solving Steps:**\n1. Observe the pattern\n2. Identify the rule\n3. Apply the rule\n4. Verify the answer',
                resources: ['https://www.khanacademy.org/math/pre-algebra/pre-algebra-patterns'],
                estimatedMins: 20
              }
            }
          ]
        },
        {
          title: 'Logic Challenge',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Pattern Completion',
              type: 'logic',
              order: 1,
              content: {
                challengeId: 'pattern-complete',
                description: 'Complete the pattern: 2, 4, 6, 8, __',
                questions: [
                  {
                    pattern: [2, 4, 6, 8],
                    answer: 10,
                    rule: 'add 2'
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      key: 'logic-intermediate',
      title: 'Logical Reasoning',
      description: 'Solve complex logic puzzles, deduction problems, and analytical challenges.',
      difficulty: 'Intermediate',
      category: 'Logic',
      prerequisiteKeys: ['logic-beginner'],
      modules: [
        {
          title: 'Deductive Reasoning',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Logic Grids & Deduction',
              order: 1,
              content: {
                subtitle: 'Solving Complex Logic Puzzles',
                body: '**Deductive Reasoning:**\nDraw conclusions from given facts\n\n**Example Problem:**\n- Alice, Bob, and Carol are a doctor, teacher, and engineer\n- Alice is not a teacher\n- The engineer plays tennis\n- Bob doesn\'t play tennis\n\n**Solution Process:**\n1. Make a grid\n2. Mark known facts\n3. Use elimination\n4. Deduce remaining facts\n\n**Answer:** Alice=Engineer, Bob=Doctor, Carol=Teacher\n\n**Logical Operators:**\n- AND: Both must be true\n- OR: At least one is true\n- NOT: Inverse\n- IF-THEN: Conditional',
                resources: ['https://www.puzzles.com/puzzleplayground/LogicGridPuzzles.htm'],
                estimatedMins: 30
              }
            }
          ]
        },
        {
          title: 'Logic Grid Challenge',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Logic Grid Puzzle',
              type: 'logic',
              order: 1,
              content: {
                challengeId: 'logic-grid',
                description: 'Solve a logic grid puzzle using deductive reasoning.',
                puzzle: {
                  clues: [
                    'Three people: Alice, Bob, Carol',
                    'Three jobs: Doctor, Teacher, Engineer',
                    'Alice is not a teacher',
                    'The engineer plays tennis',
                    'Bob doesn\'t play tennis'
                  ]
                }
              }
            }
          ]
        }
      ]
    },
    {
      key: 'logic-advanced',
      title: 'Advanced Logic & Problem Solving',
      description: 'Master complex deduction, algorithmic thinking, and advanced problem-solving strategies.',
      difficulty: 'Advanced',
      category: 'Logic',
      prerequisiteKeys: ['logic-intermediate'],
      modules: [
        {
          title: 'Algorithmic Thinking',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Complex Problem Decomposition',
              order: 1,
              content: {
                subtitle: 'Breaking Down Complex Problems',
                body: '**Problem-Solving Framework:**\n\n**1. Understand:**\n- What is given?\n- What is unknown?\n- What are constraints?\n\n**2. Plan:**\n- Break into subproblems\n- Identify patterns\n- Consider edge cases\n\n**3. Execute:**\n- Implement solution\n- Test incrementally\n\n**4. Review:**\n- Verify correctness\n- Optimize\n\n**Advanced Techniques:**\n- Recursion\n- Dynamic programming\n- Backtracking\n- Divide and conquer',
                resources: ['https://www.geeksforgeeks.org/problem-solving-techniques/'],
                estimatedMins: 40
              }
            }
          ]
        },
        {
          title: 'Advanced Logic Challenge',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Complex Deduction',
              type: 'logic',
              order: 1,
              content: {
                challengeId: 'complex-deduction',
                description: 'Solve multi-layered logic problems requiring advanced reasoning.',
                puzzle: {
                  type: 'multi-constraint',
                  difficulty: 'hard'
                }
              }
            }
          ]
        }
      ]
    },

    // ===== 7. TRIVIA/PUZZLE TRACKS =====
    {
      key: 'trivia-beginner',
      title: 'IT Fundamentals Quiz',
      description: 'Test your knowledge of basic IT concepts, terminology, and computer science.',
      difficulty: 'Beginner',
      category: 'Trivia',
      modules: [
        {
          title: 'Computer Basics',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'IT Terminology',
              order: 1,
              content: {
                subtitle: 'Essential IT Vocabulary',
                body: '**Hardware Terms:**\n- **CPU:** Central Processing Unit (brain)\n- **RAM:** Random Access Memory (short-term)\n- **SSD/HDD:** Storage devices (long-term)\n- **GPU:** Graphics Processing Unit\n\n**Software Terms:**\n- **OS:** Operating System (Windows, Mac, Linux)\n- **Application:** Program for specific tasks\n- **Browser:** Web navigation (Chrome, Firefox)\n\n**Network Terms:**\n- **IP Address:** Device identifier\n- **URL:** Web address\n- **ISP:** Internet Service Provider\n- **WiFi:** Wireless networking\n\n**File Types:**\n- .exe (executable)\n- .pdf (document)\n- .jpg (image)\n- .mp4 (video)',
                resources: ['https://www.comptia.org/'],
                estimatedMins: 20
              }
            }
          ]
        },
        {
          title: 'IT Knowledge Quiz',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'IT Basics Trivia',
              type: 'trivia',
              order: 1,
              content: {
                questions: [
                  {
                    question: 'What does CPU stand for?',
                    options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'],
                    correct: 0
                  },
                  {
                    question: 'Which is a web browser?',
                    options: ['Windows', 'Chrome', 'Excel', 'Photoshop'],
                    correct: 1
                  },
                  {
                    question: 'What does RAM stand for?',
                    options: ['Read Access Memory', 'Random Access Memory', 'Rapid Application Memory', 'Real Access Module'],
                    correct: 1
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      key: 'trivia-intermediate',
      title: 'Programming & Tech Trivia',
      description: 'Challenge your knowledge of programming languages, frameworks, and development tools.',
      difficulty: 'Intermediate',
      category: 'Trivia',
      prerequisiteKeys: ['trivia-beginner'],
      modules: [
        {
          title: 'Programming Languages',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Language Paradigms & Use Cases',
              order: 1,
              content: {
                subtitle: 'Understanding Different Programming Languages',
                body: '**Language Categories:**\n\n**Web Development:**\n- JavaScript: Frontend/Backend\n- Python: Backend/Data Science\n- PHP: Server-side\n- TypeScript: Typed JavaScript\n\n**Systems Programming:**\n- C/C++: Performance-critical\n- Rust: Memory-safe systems\n- Go: Concurrent systems\n\n**Mobile:**\n- Swift: iOS\n- Kotlin: Android\n- React Native: Cross-platform\n\n**Data Science:**\n- Python: ML/AI\n- R: Statistics\n- Julia: High-performance computing\n\n**Key Concepts:**\n- Compiled vs Interpreted\n- Static vs Dynamic typing\n- OOP, Functional, Procedural',
                resources: ['https://www.tiobe.com/tiobe-index/'],
                estimatedMins: 30
              }
            }
          ]
        },
        {
          title: 'Programming Quiz',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Programming Languages Trivia',
              type: 'trivia',
              order: 1,
              content: {
                questions: [
                  {
                    question: 'Which language is known for "write once, run anywhere"?',
                    options: ['Python', 'Java', 'C++', 'Ruby'],
                    correct: 1
                  },
                  {
                    question: 'What is React?',
                    options: ['Programming language', 'JavaScript library', 'Database', 'Operating system'],
                    correct: 1
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      key: 'trivia-advanced',
      title: 'Advanced Tech Topics',
      description: 'Master advanced concepts in cloud computing, AI/ML, DevOps, and emerging technologies.',
      difficulty: 'Advanced',
      category: 'Trivia',
      prerequisiteKeys: ['trivia-intermediate'],
      modules: [
        {
          title: 'Emerging Technologies',
          type: 'lesson',
          order: 1,
          lessons: [
            {
              title: 'Cloud, AI, and Modern Architectures',
              order: 1,
              content: {
                subtitle: 'Understanding Modern Tech Stack',
                body: '**Cloud Computing:**\n- **IaaS:** Infrastructure (AWS EC2)\n- **PaaS:** Platform (Heroku)\n- **SaaS:** Software (Gmail)\n\n**AI/ML Concepts:**\n- Machine Learning: Learn from data\n- Deep Learning: Neural networks\n- NLP: Natural language processing\n- Computer Vision: Image recognition\n\n**Modern Architecture:**\n- Microservices\n- Serverless (Lambda)\n- Containers (Docker)\n- Orchestration (Kubernetes)\n\n**DevOps:**\n- CI/CD pipelines\n- Infrastructure as Code\n- Monitoring & Logging\n- Site Reliability Engineering',
                resources: ['https://aws.amazon.com/what-is-cloud-computing/'],
                estimatedMins: 40
              }
            }
          ]
        },
        {
          title: 'Advanced Tech Quiz',
          type: 'game',
          order: 2,
          games: [
            {
              name: 'Cloud & AI Trivia',
              type: 'trivia',
              order: 1,
              content: {
                questions: [
                  {
                    question: 'What does Kubernetes orchestrate?',
                    options: ['Databases', 'Containers', 'Virtual Machines', 'Web Servers'],
                    correct: 1
                  },
                  {
                    question: 'What is the primary purpose of Docker?',
                    options: ['Version control', 'Containerization', 'Database management', 'Web hosting'],
                    correct: 1
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ];

  console.log(`📦 Creating ${allTracks.length} tracks with prerequisites...`);

  // First pass: Create all tracks
  for (const trackData of allTracks) {
    const { key, modules, prerequisiteKeys, ...trackInfo } = trackData;
    
    const track = await prisma.track.create({
      data: trackInfo
    });
    
    trackIds[key] = track.id;
    console.log(`✅ Created track: ${track.title} (${track.difficulty})`);

    // Create modules, lessons, and games
    if (modules && modules.length > 0) {
      for (const moduleData of modules) {
        const { lessons, games, ...moduleInfo } = moduleData;
        
        const module = await prisma.module.create({
          data: {
            ...moduleInfo,
            trackId: track.id
          }
        });
        
        console.log(`  📚 Module: ${module.title}`);

        if (lessons && lessons.length > 0) {
          for (const lessonData of lessons) {
            await prisma.lesson.create({
              data: {
                ...lessonData,
                moduleId: module.id
              }
            });
            console.log(`    📖 Lesson: ${lessonData.title}`);
          }
        }

        if (games && games.length > 0) {
          for (const gameData of games) {
            await prisma.game.create({
              data: {
                ...gameData,
                moduleId: module.id,
                trackId: track.id
              }
            });
            console.log(`    🎮 Game: ${gameData.name}`);
          }
        }
      }
    }
  }

  // Second pass: Set up prerequisites
  console.log('\n🔗 Setting up prerequisites...');
  for (const trackData of allTracks) {
    if (trackData.prerequisiteKeys && trackData.prerequisiteKeys.length > 0) {
      const prerequisiteIds = trackData.prerequisiteKeys.map(key => trackIds[key]);
      
      await prisma.track.update({
        where: { id: trackIds[trackData.key] },
        data: {
          prerequisites: prerequisiteIds
        }
      });
      
      console.log(`  🔒 ${trackData.title} requires: ${trackData.prerequisiteKeys.join(', ')}`);
    }
  }

  console.log(`\n🎉 Comprehensive seeding complete!`);
  console.log(`📊 Summary:`);
  console.log(`   - Total tracks: ${allTracks.length}`);
  console.log(`   - Game types: 7 (coding, trivia, network, threat, sql-quiz, logic, puzzle)`);
  console.log(`   - Difficulty levels: 3 per game type (Beginner → Intermediate → Advanced)`);
  console.log(`   - Prerequisites configured for progressive learning`);
}

main()
  .catch((e) => {
    console.error('Error seeding tracks:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
