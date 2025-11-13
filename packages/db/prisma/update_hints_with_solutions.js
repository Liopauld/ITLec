const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Solution hints for common coding challenges
const codingSolutions = {
  'array-sum': `function sumArray(arr) {
  return arr.reduce((sum, num) => sum + num, 0);
}

// Alternative with for loop:
function sumArray(arr) {
  let sum = 0;
  for (let num of arr) {
    sum += num;
  }
  return sum;
}`,
  
  'reverse-string': `function reverseString(str) {
  return str.split('').reverse().join('');
}

// Alternative manual approach:
function reverseString(str) {
  let reversed = '';
  for (let i = str.length - 1; i >= 0; i--) {
    reversed += str[i];
  }
  return reversed;
}`,
  
  'fibonacci': `function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

// Recursive (less efficient):
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
  
  'palindrome': `function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/\\s/g, '');
  return clean === clean.split('').reverse().join('');
}

// Alternative two-pointer approach:
function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/\\s/g, '');
  let left = 0, right = clean.length - 1;
  while (left < right) {
    if (clean[left] !== clean[right]) return false;
    left++; right--;
  }
  return true;
}`,
  
  'prime-checker': `function isPrime(num) {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  
  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}`
};

async function main() {
  console.log('💡 Updating hints with actual solution code...\n');

  // Get all tracks with their modules
  const tracks = await prisma.track.findMany({
    include: {
      modules: true
    }
  });

  let updatedCount = 0;

  for (const track of tracks) {
    const difficulty = track.difficulty?.toLowerCase();
    
    for (const module of track.modules) {
      // Try to extract challenge ID from module content
      let challengeId = null;
      let solutionHint = null;
      
      if (module.content && typeof module.content === 'object') {
        const content = module.content;
        if (content.challengeId) {
          challengeId = content.challengeId;
          solutionHint = codingSolutions[challengeId];
        }
      }
      
      // Create appropriate hint based on module type and difficulty
      let hintText = '';
      
      if (solutionHint) {
        // This is a coding challenge with a known solution
        hintText = `💡 Solution:\n\n${solutionHint}\n\nTry to understand how this works before using it!`;
      } else {
        // General hints based on module type and difficulty
        if (module.type === 'coding') {
          hintText = difficulty === 'beginner'
            ? 'Think step by step:\n1. Read the problem carefully\n2. Break it into smaller parts\n3. Write simple code first\n4. Test with examples\n5. Improve your solution'
            : difficulty === 'intermediate'
            ? 'Approach:\n1. Consider edge cases\n2. Think about time complexity\n3. Use appropriate data structures\n4. Write clean, readable code'
            : 'Advanced tips:\n1. Optimize your algorithm\n2. Consider memory usage\n3. Handle all edge cases\n4. Write efficient code';
        } else if (module.type === 'network') {
          hintText = 'Network Topology Hints:\n• Start with core devices (routers/switches)\n• Connect edge devices to switches\n• Link switches to routers\n• Consider redundancy for critical connections';
        } else if (module.type === 'threat') {
          hintText = 'Security Analysis:\n• Look for unauthorized access attempts\n• Check for data exfiltration patterns\n• Identify privilege escalation\n• Review suspicious network traffic\n• Examine unusual user behavior';
        } else if (module.type === 'sql-quiz') {
          hintText = 'SQL Query Tips:\n• Use SELECT to retrieve data\n• WHERE clause for filtering\n• JOIN to combine tables\n• GROUP BY for aggregation\n• ORDER BY to sort results';
        } else {
          hintText = difficulty === 'beginner'
            ? 'Take your time and read the instructions carefully. You got this!'
            : difficulty === 'intermediate'
            ? 'Think about what you learned in previous modules. Break down the problem into smaller steps.'
            : 'This is challenging! Review the related concepts and try different approaches.';
        }
      }
      
      await prisma.module.update({
        where: { id: module.id },
        data: {
          hints: {
            general: hintText
          }
        }
      });
      
      updatedCount++;
      if (challengeId) {
        console.log(`✅ Added solution for "${challengeId}" in "${track.title}"`);
      }
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} modules with hints!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
