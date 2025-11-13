// Comprehensive seed script with complete 3-level tracks for all 7 game types
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive track seeding...');
  
  // Find an IT Professional user to be the creator (or use null)
  const itProfessional = await prisma.user.findFirst({
    where: { role: 'IT Professional' }
  });
  
  const creatorId = itProfessional?.id || null;
  
  const tracks = [
    // 1. CODING GAME TRACKS (3 levels)
    {
      title: 'JavaScript Programming Fundamentals',
      description: 'Master JavaScript basics with hands-on coding challenges. Perfect for beginners starting their programming journey.',
      difficulty: 'Beginner',
      category: 'JavaScript Programming',
      creatorId,
      games: [
        {
          name: 'Array Sum Challenge',
          type: 'coding',
          content: { 
            challengeId: 'array-sum',
            description: 'Write a function that returns the sum of all numbers in an array.', 
            starterCode: 'function sumArray(arr) {\n  // Your code here\n  // Example: sumArray([1,2,3]) should return 6\n}'
          }
        },
        {
          name: 'String Reverser',
          type: 'coding',
          content: { 
            challengeId: 'reverse-string',
            description: 'Write a function that reverses a string.', 
            starterCode: 'function reverseString(str) {\n  // Your code here\n  // Example: reverseString("hello") should return "olleh"\n}'
          }
        },
        {
          name: 'Palindrome Checker',
          type: 'coding',
          content: { 
            challengeId: 'palindrome',
            description: 'Write a function that checks if a string is a palindrome.', 
            starterCode: 'function isPalindrome(str) {\n  // Your code here\n  // Example: isPalindrome("racecar") should return true\n}'
          }
        }
      ]
    },
    {
      title: 'JavaScript Programming - Intermediate Algorithms',
      description: 'Take your JavaScript skills to the next level with advanced algorithms and problem-solving techniques.',
      difficulty: 'Intermediate',
      category: 'JavaScript Programming',
      creatorId,
      games: [
        {
          name: 'Fibonacci Sequence',
          type: 'coding',
          content: { 
            challengeId: 'fibonacci',
            description: 'Write a function that returns the nth Fibonacci number.', 
            starterCode: 'function fibonacci(n) {\n  // Your code here\n  // Example: fibonacci(5) should return 5 (sequence: 0,1,1,2,3,5)\n}'
          }
        },
        {
          name: 'Prime Number Checker',
          type: 'coding',
          content: { 
            challengeId: 'prime-checker',
            description: 'Write a function that checks if a number is prime.', 
            starterCode: 'function isPrime(num) {\n  // Your code here\n  // Example: isPrime(17) should return true\n}'
          }
        }
      ]
    },
    {
      title: 'JavaScript Programming - Advanced Data Structures',
      description: 'Master complex data structures and optimization techniques with challenging coding exercises.',
      difficulty: 'Advanced',
      category: 'JavaScript Programming',
      creatorId,
      games: [
        {
          name: 'Custom Sort',
          type: 'coding',
          content: { 
            challengeId: 'custom-sort',
            description: 'Implement a custom sorting algorithm.', 
            starterCode: 'function customSort(arr) {\n  // Implement bubble sort or your preferred algorithm\n  // Return sorted array in ascending order\n}'
          }
        }
      ]
    },

    // 2. NETWORK GAME TRACKS (3 levels)
    {
      title: 'Network Fundamentals - Basic Topology',
      description: 'Learn network basics by building simple network topologies. Understand devices and connections.',
      difficulty: 'Beginner',
      category: 'Networking',
      creatorId,
      games: [
        {
          name: 'Simple Network Setup',
          type: 'network',
          content: { 
            description: 'Connect a PC to a Router using a Switch.',
            devices: ['PC', 'Switch', 'Router'],
            connections: [['PC', 'Switch'], ['Switch', 'Router']]
          }
        }
      ]
    },
    {
      title: 'Network Engineering - LAN Design',
      description: 'Design and implement Local Area Networks with multiple devices and proper segmentation.',
      difficulty: 'Intermediate',
      category: 'Networking',
      creatorId,
      games: [
        {
          name: 'Multi-Device LAN',
          type: 'network',
          content: { 
            description: 'Build a network with 2 PCs, 2 Switches, and a Router.',
            devices: ['PC', 'PC', 'Switch', 'Switch', 'Router'],
            connections: [['PC', 'Switch'], ['PC', 'Switch'], ['Switch', 'Router'], ['Switch', 'Router']]
          }
        }
      ]
    },
    {
      title: 'Network Architecture - Enterprise Networks',
      description: 'Master complex enterprise network architectures with servers, firewalls, and redundancy.',
      difficulty: 'Advanced',
      category: 'Networking',
      creatorId,
      games: [
        {
          name: 'Enterprise Network',
          type: 'network',
          content: { 
            description: 'Design a complete enterprise network with Server, Firewall, multiple Switches and Routers.',
            devices: ['Server', 'Firewall', 'Router', 'Switch', 'Switch', 'PC', 'PC'],
            connections: [['Server', 'Switch'], ['Switch', 'Firewall'], ['Firewall', 'Router'], ['Router', 'Switch'], ['Switch', 'PC'], ['Switch', 'PC']]
          }
        }
      ]
    },

    // 3. THREAT/CYBERSECURITY TRACKS (3 levels)
    {
      title: 'Cybersecurity Basics - Threat Awareness',
      description: 'Learn to identify common security threats like phishing, malware, and social engineering attacks.',
      difficulty: 'Beginner',
      category: 'Cybersecurity',
      creatorId,
      games: [
        {
          name: 'Phishing Email Detection',
          type: 'threat',
          content: { 
            details: 'A user receives an email claiming to be from their bank, asking them to click a link to verify their account information.',
            question: 'Identify all security threats in this scenario.'
          }
        }
      ]
    },
    {
      title: 'Cybersecurity - Network Security',
      description: 'Analyze network-based attacks and implement security measures to protect systems.',
      difficulty: 'Intermediate',
      category: 'Cybersecurity',
      creatorId,
      games: [
        {
          name: 'Network Attack Analysis',
          type: 'threat',
          content: { 
            details: 'Multiple failed login attempts detected from the same IP address, followed by a successful login. User downloads an unusual executable file.',
            question: 'What security threats are present and what actions should be taken?'
          }
        }
      ]
    },
    {
      title: 'Cybersecurity - Advanced Threat Detection',
      description: 'Master advanced persistent threats, zero-day exploits, and sophisticated attack patterns.',
      difficulty: 'Advanced',
      category: 'Cybersecurity',
      creatorId,
      games: [
        {
          name: 'APT Investigation',
          type: 'threat',
          content: { 
            details: 'Unusual outbound traffic detected to unknown IPs. Encrypted files found in system directories. Registry modifications observed. Scheduled tasks created by unknown process.',
            question: 'Analyze this Advanced Persistent Threat scenario and identify all indicators of compromise.'
          }
        }
      ]
    },

    // 4. SQL-QUIZ TRACKS (3 levels)
    {
      title: 'SQL Fundamentals - Basic Queries',
      description: 'Master basic SQL queries including SELECT, WHERE, and simple data retrieval operations.',
      difficulty: 'Beginner',
      category: 'Database Management',
      creatorId,
      games: [
        {
          name: 'Basic SQL Queries',
          type: 'sql-quiz',
          content: { 
            questions: [
              { question: 'Write a SQL query to select all columns from the users table.', answer: 'SELECT * FROM users;' },
              { question: 'Select only the name and email columns from users.', answer: 'SELECT name, email FROM users;' }
            ]
          }
        }
      ]
    },
    {
      title: 'SQL Database Management - Joins & Aggregations',
      description: 'Learn advanced SQL techniques including JOINs, GROUP BY, and aggregate functions.',
      difficulty: 'Intermediate',
      category: 'Database Management',
      creatorId,
      games: [
        {
          name: 'SQL Joins & Aggregates',
          type: 'sql-quiz',
          content: { 
            questions: [
              { question: 'Count the total number of users with role "admin".', answer: 'SELECT COUNT(*) FROM users WHERE role = "admin";' },
              { question: 'Select users and their orders using an INNER JOIN.', answer: 'SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id;' }
            ]
          }
        }
      ]
    },
    {
      title: 'SQL Advanced - Complex Queries & Optimization',
      description: 'Master complex subqueries, window functions, CTEs, and query optimization techniques.',
      difficulty: 'Advanced',
      category: 'Database Management',
      creatorId,
      games: [
        {
          name: 'Advanced SQL Techniques',
          type: 'sql-quiz',
          content: { 
            questions: [
              { question: 'Write a query using a CTE to find users who made more than 5 orders.', answer: 'WITH user_orders AS (SELECT user_id, COUNT(*) as count FROM orders GROUP BY user_id) SELECT * FROM users WHERE id IN (SELECT user_id FROM user_orders WHERE count > 5);' },
              { question: 'Use a window function to rank users by total order amount.', answer: 'SELECT user_id, SUM(amount) as total, RANK() OVER (ORDER BY SUM(amount) DESC) as rank FROM orders GROUP BY user_id;' }
            ]
          }
        }
      ]
    },

    // 5. LOGIC GAME TRACKS (3 levels)
    {
      title: 'Logical Thinking Basics - Pattern Recognition',
      description: 'Develop logical thinking skills with pattern completion and sequence finding exercises.',
      difficulty: 'Beginner',
      category: 'Problem Solving',
      creatorId,
      games: [
        {
          name: 'Pattern Completion',
          type: 'logic',
          content: {
            challengeId: 'pattern-completion',
            question: 'Complete the sequence: 2, 4, 8, 16, ?',
            correctAnswer: '32',
            explanation: 'Each number is double the previous number (powers of 2)'
          }
        },
        {
          name: 'Sequence Finding',
          type: 'logic',
          content: {
            challengeId: 'sequence-finding',
            question: 'What comes next: A, C, F, J, ?',
            correctAnswer: 'O',
            explanation: 'The gaps between letters increase by 1 each time: +2, +3, +4, +5'
          }
        }
      ]
    },
    {
      title: 'Logical Reasoning - Intermediate Puzzles',
      description: 'Solve intermediate logic puzzles including grids, number series, and deductive reasoning.',
      difficulty: 'Intermediate',
      category: 'Problem Solving',
      creatorId,
      games: [
        {
          name: 'Logic Grid Challenge',
          type: 'logic',
          content: {
            challengeId: 'logic-grid',
            question: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?',
            correctAnswer: 'yes',
            explanation: 'This follows the transitive property of logical implication'
          }
        },
        {
          name: 'Number Series',
          type: 'logic',
          content: {
            challengeId: 'number-series',
            question: 'Find the missing number: 3, 7, 15, 31, ?',
            correctAnswer: '63',
            explanation: 'Each number is (previous × 2) + 1'
          }
        }
      ]
    },
    {
      title: 'Advanced Logic - Complex Deduction',
      description: 'Master complex logical deduction problems requiring multiple steps of reasoning.',
      difficulty: 'Advanced',
      category: 'Problem Solving',
      creatorId,
      games: [
        {
          name: 'Complex Logical Deduction',
          type: 'logic',
          content: {
            challengeId: 'logical-deduction',
            question: 'A > B, B > C, C > D. Which is largest?',
            correctAnswer: 'A',
            explanation: 'Following the chain of inequalities, A is greater than all others'
          }
        }
      ]
    },

    // 6. PUZZLE GAME TRACKS (3 levels)
    {
      title: 'Brain Teasers - Word Puzzles',
      description: 'Sharpen your mind with fun word scrambles and basic puzzle-solving techniques.',
      difficulty: 'Beginner',
      category: 'Puzzles',
      creatorId,
      games: [
        {
          name: 'Word Scramble',
          type: 'puzzle',
          content: {
            challengeId: 'word-scramble',
            description: 'Unscramble these letters: TPMOCRUE',
            correctAnswer: 'COMPUTER',
            difficulty: 'easy'
          }
        },
        {
          name: 'Another Word Scramble',
          type: 'puzzle',
          content: {
            challengeId: 'word-scramble-2',
            description: 'Unscramble these letters: THNOPY',
            correctAnswer: 'PYTHON',
            difficulty: 'easy'
          }
        }
      ]
    },
    {
      title: 'Puzzle Solving - Intermediate Challenges',
      description: 'Tackle more complex word and logic puzzles.',
      difficulty: 'Intermediate',
      category: 'Puzzles',
      creatorId,
      games: [
        {
          name: 'Tech Term Scramble',
          type: 'puzzle',
          content: {
            challengeId: 'word-scramble-3',
            description: 'Unscramble these letters: AATSEABD',
            correctAnswer: 'DATABASE',
            difficulty: 'medium'
          }
        },
        {
          name: 'Programming Scramble',
          type: 'puzzle',
          content: {
            challengeId: 'word-scramble-4',
            description: 'Unscramble these letters: AVASCJIRTP',
            correctAnswer: 'JAVASCRIPT',
            difficulty: 'medium'
          }
        }
      ]
    },
    {
      title: 'Master Puzzle Solver - Expert Level',
      description: 'Challenge yourself with the most difficult word puzzles.',
      difficulty: 'Advanced',
      category: 'Puzzles',
      creatorId,
      games: [
        {
          name: 'Complex Tech Term',
          type: 'puzzle',
          content: {
            challengeId: 'word-scramble-5',
            description: 'Unscramble these letters: MECIHAN NLGAIRNE',
            correctAnswer: 'MACHINE LEARNING',
            difficulty: 'hard'
          }
        }
      ]
    },

    // 7. TRIVIA GAME TRACKS (3 levels)
    {
      title: 'IT Trivia - Programming Basics',
      description: 'Test your knowledge of programming fundamentals with multiple-choice quizzes.',
      difficulty: 'Beginner',
      category: 'IT Knowledge',
      creatorId,
      games: [
        {
          name: 'Programming Basics Quiz',
          type: 'trivia',
          content: {
            challengeId: 'programming-basics',
            description: 'Test your knowledge of programming fundamentals including variables, loops, and functions.',
            questions: [
              {
                question: 'What is a variable in programming?',
                options: [
                  'A container for storing data values',
                  'A type of loop',
                  'A function that returns nothing',
                  'A programming language'
                ],
                correctAnswer: 0
              },
              {
                question: 'Which loop is guaranteed to execute at least once?',
                options: [
                  'for loop',
                  'while loop',
                  'do-while loop',
                  'foreach loop'
                ],
                correctAnswer: 2
              },
              {
                question: 'What does "function" mean in programming?',
                options: [
                  'A syntax error',
                  'A reusable block of code that performs a specific task',
                  'A type of variable',
                  'A database query'
                ],
                correctAnswer: 1
              },
              {
                question: 'What is an array?',
                options: [
                  'A single variable',
                  'A function',
                  'A collection of elements stored at contiguous memory locations',
                  'A loop structure'
                ],
                correctAnswer: 2
              }
            ]
          }
        }
      ]
    },
    {
      title: 'IT Trivia - Networking Fundamentals',
      description: 'Assess your understanding of networking concepts, protocols, and technologies.',
      difficulty: 'Intermediate',
      category: 'IT Knowledge',
      creatorId,
      games: [
        {
          name: 'Networking Quiz',
          type: 'trivia',
          content: {
            challengeId: 'networking-fundamentals',
            description: 'Answer questions about TCP/IP, OSI model, routing, and network protocols.'
          }
        }
      ]
    },
    {
      title: 'IT Trivia - Advanced Topics',
      description: 'Master advanced IT topics including cybersecurity, databases, and system architecture.',
      difficulty: 'Advanced',
      category: 'IT Knowledge',
      creatorId,
      games: [
        {
          name: 'Cybersecurity Quiz',
          type: 'trivia',
          content: {
            challengeId: 'cybersecurity-basics',
            description: 'Challenge yourself with questions about encryption, threats, and security best practices.'
          }
        },
        {
          name: 'Database Concepts Quiz',
          type: 'trivia',
          content: {
            challengeId: 'database-concepts',
            description: 'Test your advanced knowledge of database design, normalization, and optimization.'
          }
        }
      ]
    }
  ];

  console.log(`📦 Creating ${tracks.length} tracks with modules and games...`);
  
  for (const trackData of tracks) {
    const { games, ...trackInfo } = trackData;
    
    const createdTrack = await prisma.track.create({ 
      data: trackInfo 
    });
    
    console.log(`✅ Created track: ${createdTrack.title} (${createdTrack.difficulty})`);
    
    if (games && games.length > 0) {
      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        
        // Create a module for this game
        const createdModule = await prisma.module.create({
          data: {
            trackId: createdTrack.id,
            type: game.type,
            content: {
              title: game.name,
              description: game.content.question || game.content.description || `${game.name} challenge`
            },
            order: i + 1
          }
        });
        
        console.log(`  📄 Created module: ${game.name} (${game.type})`);
        
        // Create the game linked to both track AND module
        await prisma.game.create({ 
          data: {
            ...game,
            trackId: createdTrack.id,
            moduleId: createdModule.id
          }
        });
        
        console.log(`  🎮 Added ${game.type} game: ${game.name}`);
      }
    }
  }
  
  console.log('\n🎉 Comprehensive track seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Total tracks: ${tracks.length}`);
  console.log(`   - Game types covered: 7 (coding, network, threat, sql-quiz, logic, puzzle, trivia)`);
  console.log(`   - Each game type has 3 difficulty levels (Beginner → Intermediate → Advanced)`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
