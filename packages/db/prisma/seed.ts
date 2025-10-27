import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetting database...');

  // Order matters if there are relations
  await prisma.assessment.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.question.deleteMany({});
  console.log('✅ Tables cleared.');

  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await prisma.user.createMany({
    data: [
      {
        name: 'IT Professional',
        email: 'itprof@example.com',
        password: hashedPassword,
        role: 'IT Professional',
        bio: 'Experienced IT professional ready to create learning tracks'
      },
      {
        name: 'John Student',
        email: 'student@example.com',
        password: hashedPassword,
        role: 'student',
        bio: 'Eager to learn IT skills'
      },
      {
        name: 'Career Switcher',
        email: 'switcher@example.com',
        password: hashedPassword,
        role: 'career_switcher',
        bio: 'Switching careers into IT field'
      }
    ]
  });

  console.log('✅ Created sample users.');
  console.log('📧 User credentials:');
  console.log('   IT Professional: itprof@example.com / password123');
  console.log('   Student: student@example.com / password123');
  console.log('   Career Switcher: switcher@example.com / password123');

  console.log('📥 Inserting questions...');
  await prisma.question.createMany({
    data: [
      // Section A: Computer Fundamentals
      { stem: 'Which of the following is the brain of the computer?', type: 'mcq', tags: ['computer_fundamentals'], options: ['Monitor', 'CPU', 'RAM', 'Hard Drive'], correct: 'CPU', weight: 1 },
      { stem: 'An operating system is an example of:', type: 'mcq', tags: ['computer_fundamentals'], options: ['Hardware', 'Software', 'Storage', 'Data'], correct: 'Software', weight: 1 },
      { stem: 'Which of the following is NOT an input device?', type: 'mcq', tags: ['computer_fundamentals'], options: ['Mouse', 'Keyboard', 'Printer', 'Scanner'], correct: 'Printer', weight: 1 },
      { stem: 'The binary number system uses which digits?', type: 'mcq', tags: ['computer_fundamentals'], options: ['0 and 1', '1 and 2', '0–9', 'A–F'], correct: '0 and 1', weight: 1 },
      { stem: 'Which one stores data permanently?', type: 'mcq', tags: ['computer_fundamentals'], options: ['RAM', 'ROM', 'Cache', 'Registers'], correct: 'ROM', weight: 1 },
      { stem: 'Which protocol is used to access websites?', type: 'mcq', tags: ['computer_fundamentals'], options: ['FTP', 'HTTP/HTTPS', 'SMTP', 'SNMP'], correct: 'HTTP/HTTPS', weight: 1 },
      { stem: 'A kilobyte (KB) is equal to:', type: 'mcq', tags: ['computer_fundamentals'], options: ['100 bytes', '1024 bytes', '1000 bytes', '512 bytes'], correct: '1024 bytes', weight: 1 },
      { stem: 'Which is the correct order of storage units (smallest to largest)?', type: 'mcq', tags: ['computer_fundamentals'], options: ['KB → GB → MB → TB', 'KB → MB → GB → TB', 'MB → KB → GB → TB', 'GB → KB → TB → MB'], correct: 'KB → MB → GB → TB', weight: 1 },
      { stem: 'The device that connects a computer to the internet is called:', type: 'mcq', tags: ['computer_fundamentals'], options: ['Switch', 'Router', 'Hub', 'Firewall'], correct: 'Router', weight: 1 },
      { stem: 'Which company developed the Windows operating system?', type: 'mcq', tags: ['computer_fundamentals'], options: ['Apple', 'Microsoft', 'IBM', 'Intel'], correct: 'Microsoft', weight: 1 },

      // Section B: Programming & Logic
      { stem: 'Which of the following is a high-level programming language?', type: 'mcq', tags: ['programming_logic'], options: ['Machine code', 'Assembly', 'Python', 'Binary'], correct: 'Python', weight: 1 },
      { stem: 'In programming, “if–else” is used for:', type: 'mcq', tags: ['programming_logic'], options: ['Repetition', 'Decision-making', 'Commenting', 'Error handling'], correct: 'Decision-making', weight: 1 },
      { stem: 'What is the output of print(3 + 2 * 2) in Python?', type: 'mcq', tags: ['programming_logic'], options: ['10', '7', '12', '9'], correct: '7', weight: 1 },
      { stem: 'Which symbol is used for comments in Python?', type: 'mcq', tags: ['programming_logic'], options: ['//', '<!-- -->', '#', '/* */'], correct: '#', weight: 1 },
      { stem: 'What does HTML stand for?', type: 'mcq', tags: ['programming_logic'], options: ['Hyperlinks and Text Markup Language', 'Hyper Text Markup Language', 'Home Tool Markup Language', 'Hyper Transfer Markup Language'], correct: 'Hyper Text Markup Language', weight: 1 },
      { stem: 'In databases, SQL stands for:', type: 'mcq', tags: ['programming_logic'], options: ['Sequential Query Language', 'Structured Query Language', 'Standard Quick Language', 'Simple Query Language'], correct: 'Structured Query Language', weight: 1 },
      { stem: 'A loop that never ends is called:', type: 'mcq', tags: ['programming_logic'], options: ['While loop', 'Infinite loop', 'For loop', 'Endless loop'], correct: 'Infinite loop', weight: 1 },
      { stem: 'Which of the following is an example of object-oriented programming?', type: 'mcq', tags: ['programming_logic'], options: ['C', 'Java', 'Assembly', 'Pascal'], correct: 'Java', weight: 1 },
      { stem: 'Which data structure works on the principle FIFO (First In, First Out)?', type: 'mcq', tags: ['programming_logic'], options: ['Stack', 'Queue', 'Array', 'Tree'], correct: 'Queue', weight: 1 },
      { stem: 'Which operator is used for equality comparison in most programming languages?', type: 'mcq', tags: ['programming_logic'], options: ['=', '==', '!=', '==='], correct: '==', weight: 1 },

      // Section C: Math & Logical Reasoning
      { stem: 'Solve: 15 × 4 – 20 ÷ 5 = ?', type: 'mcq', tags: ['math_logic'], options: ['55', '50', '40', '60'], correct: '50', weight: 1 },
      { stem: 'If x = 5, what is the value of 2x² – 3x + 4?', type: 'mcq', tags: ['math_logic'], options: ['39', '41', '47', '51'], correct: '41', weight: 1 },
      { stem: 'A clock shows 3:15. What is the angle between the hour and minute hands?', type: 'mcq', tags: ['math_logic'], options: ['0°', '7.5°', '15°', '45°'], correct: '7.5°', weight: 1 },
      { stem: 'Which is a prime number?', type: 'mcq', tags: ['math_logic'], options: ['9', '15', '17', '21'], correct: '17', weight: 1 },
      { stem: 'Find the missing number: 2, 4, 8, 16, ?', type: 'mcq', tags: ['math_logic'], options: ['24', '30', '32', '36'], correct: '32', weight: 1 },
      { stem: 'Which comes next in the sequence: A, C, E, G, ?', type: 'mcq', tags: ['math_logic'], options: ['I', 'H', 'J', 'K'], correct: 'I', weight: 1 },
      { stem: 'If 12 workers can finish a task in 6 days, how many days will 8 workers take (assuming equal efficiency)?', type: 'mcq', tags: ['math_logic'], options: ['9', '8', '10', '12'], correct: '9', weight: 1 },
      { stem: 'Solve: √144 = ?', type: 'mcq', tags: ['math_logic'], options: ['10', '11', '12', '14'], correct: '12', weight: 1 },
      { stem: 'A bag contains 5 red, 3 blue, and 2 green balls. What is the probability of picking a red ball?', type: 'mcq', tags: ['math_logic'], options: ['1/2', '5/10', '5/7', '1/3'], correct: '1/2', weight: 1 },
      { stem: 'Convert binary 1010 to decimal.', type: 'mcq', tags: ['math_logic'], options: ['8', '9', '10', '12'], correct: '10', weight: 1 },

      // Section D: Digital Literacy & Cybersecurity
      { stem: 'Which of the following is a strong password?', type: 'mcq', tags: ['digital_literacy'], options: ['password123', 'abcdefg', 'Qw!9zR$2', '111111'], correct: 'Qw!9zR$2', weight: 1 },
      { stem: 'Phishing is an attempt to:', type: 'mcq', tags: ['digital_literacy'], options: ['Hack computer hardware', 'Steal user information through fake emails/websites', 'Install antivirus', 'Block websites'], correct: 'Steal user information through fake emails/websites', weight: 1 },
      { stem: 'Which of these is NOT a search engine?', type: 'mcq', tags: ['digital_literacy'], options: ['Google', 'Yahoo', 'Bing', 'WhatsApp'], correct: 'WhatsApp', weight: 1 },
      { stem: 'A file with the extension .exe is usually:', type: 'mcq', tags: ['digital_literacy'], options: ['Image file', 'Executable file', 'Text file', 'Audio file'], correct: 'Executable file', weight: 1 },
      { stem: 'Which shortcut is used to copy in Windows?', type: 'mcq', tags: ['digital_literacy'], options: ['Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + P'], correct: 'Ctrl + C', weight: 1 },
      { stem: 'A firewall is used for:', type: 'mcq', tags: ['digital_literacy'], options: ['Speeding up the computer', 'Protecting against viruses', 'Monitoring and controlling network traffic', 'Installing software'], correct: 'Monitoring and controlling network traffic', weight: 1 },
      { stem: 'Which of these is an example of cloud storage?', type: 'mcq', tags: ['digital_literacy'], options: ['Google Drive', 'Microsoft Word', 'VLC Media Player', 'Photoshop'], correct: 'Google Drive', weight: 1 },
      { stem: 'The illegal copying or distribution of software is called:', type: 'mcq', tags: ['digital_literacy'], options: ['Piracy', 'Cracking', 'Debugging', 'Backup'], correct: 'Piracy', weight: 1 },
      { stem: 'Which of these is NOT malware?', type: 'mcq', tags: ['digital_literacy'], options: ['Worm', 'Virus', 'Trojan', 'Firewall'], correct: 'Firewall', weight: 1 },
      { stem: 'Which of the following best describes “two-factor authentication”?', type: 'mcq', tags: ['digital_literacy'], options: ['Using two devices at once', 'Logging in with a username and password', 'Extra security step after entering a password', 'Automatic login'], correct: 'Extra security step after entering a password', weight: 1 },

      // Section E: IT Career Awareness & Soft Skills
      { stem: 'A person who designs websites is called a:', type: 'mcq', tags: ['career_softskills'], options: ['Network Engineer', 'Web Developer', 'Data Analyst', 'System Administrator'], correct: 'Web Developer', weight: 1 },
      { stem: 'Which IT role focuses mainly on securing systems and preventing cyberattacks?', type: 'mcq', tags: ['career_softskills'], options: ['Game Developer', 'Cybersecurity Specialist', 'Graphic Designer', 'Data Scientist'], correct: 'Cybersecurity Specialist', weight: 1 },
      { stem: 'A person who works with data to find patterns and insights is called:', type: 'mcq', tags: ['career_softskills'], options: ['Programmer', 'Data Scientist', 'Network Admin', 'Web Designer'], correct: 'Data Scientist', weight: 1 },
      { stem: 'Which IT career is most related to Artificial Intelligence?', type: 'mcq', tags: ['career_softskills'], options: ['Software Tester', 'Machine Learning Engineer', 'Database Administrator', 'IT Support'], correct: 'Machine Learning Engineer', weight: 1 },
      { stem: 'Which of the following skills is MOST important for teamwork?', type: 'mcq', tags: ['career_softskills'], options: ['Communication', 'Typing speed', 'Coding ability', 'Memory'], correct: 'Communication', weight: 1 },
      { stem: 'Which of the following fields involves 3D modeling and animation?', type: 'mcq', tags: ['career_softskills'], options: ['Web Development', 'Game Development', 'Network Security', 'Data Analysis'], correct: 'Game Development', weight: 1 },
      { stem: 'Which IT field requires strong knowledge of statistics and math?', type: 'mcq', tags: ['career_softskills'], options: ['Cybersecurity', 'Data Science', 'Technical Support', 'Graphic Design'], correct: 'Data Science', weight: 1 },
      { stem: 'Which of the following is an example of soft skills?', type: 'mcq', tags: ['career_softskills'], options: ['Problem-solving', 'JavaScript coding', 'SQL queries', 'HTML tags'], correct: 'Problem-solving', weight: 1 },
      { stem: 'Time management is important because:', type: 'mcq', tags: ['career_softskills'], options: ['It makes people smarter', 'It helps finish tasks efficiently', 'It reduces the need for breaks', 'It increases computer speed'], correct: 'It helps finish tasks efficiently', weight: 1 },
      { stem: 'If you are interested in designing logos, posters, and digital art, which IT-related career path might fit best?', type: 'mcq', tags: ['career_softskills'], options: ['Cybersecurity', 'Graphic Design / Multimedia', 'Database Management', 'Network Engineering'], correct: 'Graphic Design / Multimedia', weight: 1 },
    ],
  });

  console.log('✅ Inserted 50 questions.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
