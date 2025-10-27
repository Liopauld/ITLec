// Seed script for 10 IT career tracks
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tracks = [
    {
      title: 'Network Engineering',
      description: 'Learn the fundamentals of computer networks, protocols, and network security.',
      difficulty: 'Intermediate'
    },
    {
      title: 'Cloud Architecture',
      description: 'Master cloud platforms like AWS, Azure, and GCP. Design scalable cloud solutions.',
      difficulty: 'Advanced'
    },
    {
      title: 'Cybersecurity',
      description: 'Protect systems and data. Study ethical hacking, security operations, and compliance.',
      difficulty: 'Advanced'
    },
    {
      title: 'Software Development',
      description: 'Build web, mobile, and desktop applications using modern programming languages.',
      difficulty: 'Intermediate'
    },
    {
      title: 'IT Support',
      description: 'Troubleshoot hardware/software issues and provide technical support to users.',
      difficulty: 'Beginner'
    },
    {
      title: 'Database Administration',
      description: 'Design, manage, and optimize relational and NoSQL databases.',
      difficulty: 'Intermediate'
    },
    {
      title: 'DevOps Engineering',
      description: 'Automate software delivery, CI/CD, and infrastructure management.',
      difficulty: 'Advanced'
    },
    {
      title: 'AI/ML Engineering',
      description: 'Build intelligent systems with machine learning, deep learning, and data science.',
      difficulty: 'Advanced'
    },
    {
      title: 'Web Development',
      description: 'Create responsive websites and web apps using HTML, CSS, JavaScript, and frameworks.',
      difficulty: 'Beginner'
    },
    {
      title: 'Systems Analysis',
      description: 'Analyze business requirements and design IT solutions for organizations.',
      difficulty: 'Intermediate'
    }
  ];

  for (const track of tracks) {
    const createdTrack = await prisma.track.create({ data: track });

    // Seed games for each track type
    let games = [];
    switch (track.title) {
      case 'Software Development':
      case 'Web Development':
      case 'AI/ML Engineering':
        games = [
          {
            name: 'Array Sum Challenge',
            type: 'coding',
            content: { 
              challengeId: 'array-sum',
              description: 'Write a function that returns the sum of all numbers in an array.', 
              starterCode: 'function sumArray(arr) {\n  // Your code here\n  // Example: sumArray([1,2,3]) should return 6\n}'
            },
            trackId: createdTrack.id
          },
          {
            name: 'String Reverser Challenge',
            type: 'coding',
            content: { 
              challengeId: 'reverse-string',
              description: 'Write a function that reverses a string.', 
              starterCode: 'function reverseString(str) {\n  // Your code here\n  // Example: reverseString("hello") should return "olleh"\n}'
            },
            trackId: createdTrack.id
          },
          {
            name: 'Fibonacci Challenge',
            type: 'coding',
            content: { 
              challengeId: 'fibonacci',
              description: 'Write a function that returns the nth Fibonacci number.', 
              starterCode: 'function fibonacci(n) {\n  // Your code here\n  // Example: fibonacci(5) should return 5 (sequence: 0,1,1,2,3,5)\n}'
            },
            trackId: createdTrack.id
          },
          {
            name: 'Palindrome Checker',
            type: 'coding',
            content: { 
              challengeId: 'palindrome',
              description: 'Write a function that checks if a string is a palindrome.', 
              starterCode: 'function isPalindrome(str) {\n  // Your code here\n  // Example: isPalindrome("racecar") should return true\n}'
            },
            trackId: createdTrack.id
          },
          {
            name: 'Prime Number Checker',
            type: 'coding',
            content: { 
              challengeId: 'prime-checker',
              description: 'Write a function that checks if a number is prime.', 
              starterCode: 'function isPrime(num) {\n  // Your code here\n  // Example: isPrime(17) should return true\n}'
            },
            trackId: createdTrack.id
          }
        ];
        break;
      case 'Network Engineering':
        games = [
          {
            name: 'Network Topology Builder',
            type: 'network',
            content: { description: 'Build a simple network connecting a PC, a Switch, and a Router.', devices: ['PC', 'Switch', 'Router'], connections: [['PC', 'Switch'], ['Switch', 'Router']] },
            trackId: createdTrack.id
          }
        ];
        break;
      case 'Cybersecurity':
        games = [
          {
            name: 'Threat Detection',
            type: 'threat',
            content: { details: 'A user receives an email with a suspicious link and an attachment.', question: 'Identify all potential security threats.' },
            trackId: createdTrack.id
          }
        ];
        break;
      case 'Database Administration':
        games = [
          {
            name: 'SQL Quiz',
            type: 'sql-quiz',
            content: { questions: [
              { question: 'Write a SQL query to select all users.', answer: 'SELECT * FROM users;' },
              { question: 'Count users with role "admin".', answer: 'SELECT COUNT(*) FROM users WHERE role = "admin";' }
            ] },
            trackId: createdTrack.id
          }
        ];
        break;
      default:
        games = [];
    }
    for (const game of games) {
      await prisma.game.create({ data: game });
    }
  }
  console.log('Seeded 10 IT career tracks!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
