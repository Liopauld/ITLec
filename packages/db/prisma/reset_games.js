const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Deleting all existing games...');
  await prisma.game.deleteMany({});
  console.log('✅ All games deleted!');

  console.log('\n🎮 Creating new games with challengeIds...');
  
  // Get all tracks
  const tracks = await prisma.track.findMany();
  
  for (const track of tracks) {
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
            trackId: track.id
          },
          {
            name: 'String Reverser Challenge',
            type: 'coding',
            content: { 
              challengeId: 'reverse-string',
              description: 'Write a function that reverses a string.',
              starterCode: 'function reverseString(str) {\n  // Your code here\n  // Example: reverseString("hello") should return "olleh"\n}'
            },
            trackId: track.id
          },
          {
            name: 'Fibonacci Challenge',
            type: 'coding',
            content: { 
              challengeId: 'fibonacci',
              description: 'Write a function that returns the nth Fibonacci number.',
              starterCode: 'function fibonacci(n) {\n  // Your code here\n  // Example: fibonacci(5) should return 5 (sequence: 0,1,1,2,3,5)\n}'
            },
            trackId: track.id
          },
          {
            name: 'Palindrome Checker',
            type: 'coding',
            content: { 
              challengeId: 'palindrome',
              description: 'Write a function that checks if a string is a palindrome.',
              starterCode: 'function isPalindrome(str) {\n  // Your code here\n  // Example: isPalindrome("racecar") should return true\n}'
            },
            trackId: track.id
          },
          {
            name: 'Prime Number Checker',
            type: 'coding',
            content: { 
              challengeId: 'prime-checker',
              description: 'Write a function that checks if a number is prime.',
              starterCode: 'function isPrime(num) {\n  // Your code here\n  // Example: isPrime(17) should return true\n}'
            },
            trackId: track.id
          }
        ];
        break;
      case 'Network Engineering':
        games = [
          {
            name: 'Network Topology Builder',
            type: 'network',
            content: { 
              description: 'Build a simple network connecting a PC, a Switch, and a Router.',
              devices: ['PC', 'Switch', 'Router'],
              connections: [['PC', 'Switch'], ['Switch', 'Router']]
            },
            trackId: track.id
          }
        ];
        break;
      case 'Cybersecurity':
        games = [
          {
            name: 'Threat Detection',
            type: 'threat',
            content: { 
              question: 'Identify all potential security threats.',
              details: 'A user receives an email with a suspicious link and an attachment.'
            },
            trackId: track.id
          }
        ];
        break;
      case 'Database Administration':
        games = [
          {
            name: 'SQL Quiz',
            type: 'sql-quiz',
            content: { 
              questions: [
                { question: 'Write a SQL query to select all users.', answer: 'SELECT * FROM users;' },
                { question: 'Count users with role "admin".', answer: 'SELECT COUNT(*) FROM users WHERE role = "admin";' }
              ]
            },
            trackId: track.id
          }
        ];
        break;
      default:
        games = [];
    }
    
    for (const game of games) {
      await prisma.game.create({ data: game });
      console.log(`  ✓ Created: ${game.name} for ${track.title}`);
    }
  }
  
  console.log('\n🎉 All games recreated successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
