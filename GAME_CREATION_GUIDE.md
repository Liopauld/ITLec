# Game Creation Guide - ITPathfinder

## Overview
This guide explains how to create interactive games for learning tracks in ITPathfinder. Each game type has specific fields that determine how student responses are validated.

## Game Types & Validation

### 1. 🎮 Coding Games (`type: 'coding'`)

**Purpose**: JavaScript coding challenges where students write functions to solve problems.

**Required Fields**:
- `title` - Challenge name
- `description` - What the student needs to accomplish
- `starterCode` - Initial code template
- `expectedFunction` - Function name to validate

**Optional Fields**:
- `difficulty` - easy, medium, hard
- `estimatedMins` - Estimated completion time
- `hints` - Array of hint strings
- `testCases` - Array of test case objects

**Test Case Format**:
```javascript
{
  "input": [5],           // Arguments to pass to function
  "expected": 120,        // Expected return value
  "description": "5! = 120"  // Optional explanation
}
```

**Validation**:
- Student's code is executed with test case inputs
- Return value compared to `expected` value
- All test cases must pass to complete the game

**Example**:
```json
{
  "title": "Factorial Calculator",
  "description": "Write a function that calculates factorial",
  "starterCode": "function factorial(n) {\n  // Your code here\n}",
  "expectedFunction": "factorial",
  "difficulty": "medium",
  "testCases": [
    { "input": [5], "expected": 120, "description": "5! = 120" },
    { "input": [0], "expected": 1, "description": "0! = 1" },
    { "input": [3], "expected": 6, "description": "3! = 6" }
  ],
  "hints": [
    "Start with the base case: 0! = 1",
    "Use recursion or iteration",
    "Test with both positive and edge cases"
  ]
}
```

---

### 2. 🌐 Network Games (`type: 'network'`)

**Purpose**: Network topology design where students connect devices correctly.

**Required Fields**:
- `title` - Challenge name
- `description` - Network scenario description
- `devices` - Array of device names to use
- `correctConnections` - Array of required connections

**Optional Fields**:
- `hints` - Array of hint strings

**Connection Format**: `"Device1 -> Device2"` (one per line)

**Validation**:
- Students drag and drop devices to create network diagram
- System checks if all connections in `correctConnections` exist
- Order doesn't matter, but all required connections must be present

**Example**:
```json
{
  "title": "Build a Simple LAN Network",
  "description": "Create a local area network with proper device connections",
  "devices": ["PC1", "PC2", "Router", "Switch", "Server"],
  "correctConnections": [
    "PC1 -> Switch",
    "PC2 -> Switch",
    "Switch -> Router",
    "Router -> Server"
  ],
  "hints": [
    "Start with the router in the center",
    "PCs connect to the switch",
    "Switch connects to router"
  ]
}
```

---

### 3. 🛡️ Threat Games (`type: 'threat'`)

**Purpose**: Cybersecurity scenarios where students identify threats.

**Required Fields**:
- `title` - Scenario name
- `details` - Security scenario description
- `question` - What students need to identify
- `correctThreats` - Array of correct threat names
- `options` - Array of all possible options (correct + wrong)

**Optional Fields**:
- `explanation` - Why these are the correct threats

**Validation**:
- Students select multiple threats from the options list
- System checks if selected threats match all items in `correctThreats`
- Must select all correct threats and no wrong ones

**Example**:
```json
{
  "title": "Phishing Email Attack",
  "details": "An employee received an email claiming to be from IT support asking for password reset. The email has typos and comes from a suspicious domain.",
  "question": "What security threats do you identify?",
  "correctThreats": [
    "Phishing",
    "Social Engineering",
    "Credential Theft"
  ],
  "options": [
    "Phishing",
    "Social Engineering",
    "Credential Theft",
    "DDoS Attack",
    "SQL Injection",
    "Malware",
    "Man-in-the-Middle"
  ],
  "explanation": "This is a phishing attack using social engineering to steal credentials. The suspicious email and password request are red flags."
}
```

---

### 4. 💾 SQL Quiz Games (`type: 'sql-quiz'`)

**Purpose**: SQL query writing challenges.

**Required Fields**:
- `title` - Quiz name
- `description` - Quiz instructions
- `questions` - Array of question objects

**Optional Fields**:
- `schema` - Database table structure description

**Question Format**:
```javascript
{
  "question": "Write a query to select all users older than 25",
  "correctAnswer": "SELECT * FROM users WHERE age > 25",
  "explanation": "Optional explanation"
}
```

**Validation**:
- Student's SQL query is compared to `correctAnswer`
- Whitespace and case-insensitive comparison
- Keywords, table names, and conditions must match

**Example**:
```json
{
  "title": "Basic SELECT Queries",
  "description": "Practice writing SELECT statements",
  "schema": "Table: users (id, name, email, age, country)",
  "questions": [
    {
      "question": "Select all users from USA",
      "correctAnswer": "SELECT * FROM users WHERE country = 'USA'",
      "explanation": "Use WHERE clause to filter by country"
    },
    {
      "question": "Find the average age of users",
      "correctAnswer": "SELECT AVG(age) FROM users",
      "explanation": "AVG() aggregate function calculates average"
    },
    {
      "question": "Count users by country",
      "correctAnswer": "SELECT country, COUNT(*) FROM users GROUP BY country",
      "explanation": "GROUP BY groups results, COUNT() counts rows"
    }
  ]
}
```

---

### 5. 🧩 Logic Games (`type: 'logic'`)

**Purpose**: Logic puzzles and pattern recognition.

**Required Fields**:
- `challengeId` - Type of logic puzzle
- `question` - The puzzle question
- `correctAnswer` - The correct answer

**Optional Fields**:
- `explanation` - Why this is the correct answer

**Challenge Types**:
- `pattern-completion` - Complete the pattern
- `sequence-finding` - Find next in sequence
- `logic-grid` - Solve logic grid puzzle
- `number-series` - Number pattern recognition
- `logical-deduction` - Deduction problems

**Validation**:
- Exact string match (case-insensitive)
- Trim whitespace before comparison

**Example**:
```json
{
  "challengeId": "sequence-finding",
  "question": "Complete the sequence: 2, 4, 8, 16, ?",
  "correctAnswer": "32",
  "explanation": "Each number is double the previous number (2^1, 2^2, 2^3, 2^4, 2^5)"
}
```

---

### 6. 🧩 Puzzle Games (`type: 'puzzle'`)

**Purpose**: Word and number puzzles.

**Required Fields**:
- `challengeId` - Type of puzzle
- `description` - Puzzle instructions
- `correctAnswer` - Solution

**Optional Fields**:
- `difficulty` - easy, medium, hard

**Puzzle Types**:
- `word-scramble` - Unscramble letters
- `number-puzzle` - Number-based puzzle
- `sliding-tile` - Sliding tile puzzle
- `matching-pairs` - Match related items

**Validation**:
- Case-insensitive string comparison
- Whitespace trimmed

**Example**:
```json
{
  "challengeId": "word-scramble",
  "description": "Unscramble these letters: TPMOCRUE",
  "correctAnswer": "COMPUTER",
  "difficulty": "medium"
}
```

---

### 7. 📚 Trivia Games (`type: 'trivia'`)

**Purpose**: Multiple-choice knowledge questions.

**Required Fields**:
- `challengeId` - Category of trivia
- `description` - Quiz description

**Categories**:
- `programming-basics`
- `networking-fundamentals`
- `cybersecurity-basics`
- `database-concepts`

**Note**: Questions are pre-defined for each category in the system.

**Validation**:
- Multiple choice selection
- Correct answer comparison

**Example**:
```json
{
  "challengeId": "programming-basics",
  "description": "Test your knowledge of programming fundamentals"
}
```

---

## How to Use the Game Creation Form

### Step 1: Choose Game Type
Select the appropriate game type from the dropdown based on what you want to teach.

### Step 2: Fill Required Fields
All fields marked with `*` are required. The form will prevent submission if required fields are empty.

### Step 3: Add Validation Data

**For Coding Games**:
- Add test cases using the "Add Test Case" button
- Each test case needs: input arguments, expected output, optional description

**For Network Games**:
- List devices (comma-separated)
- Add connections (one per line in format: Device1 -> Device2)

**For Threat Games**:
- List all correct threats (one per line)
- List all options including correct and wrong answers

**For SQL Quiz**:
- Click "Add Question" for each SQL question
- Provide the question prompt and correct SQL answer

### Step 4: Add Optional Enhancements
- Hints help students when they're stuck
- Explanations show after completion
- Difficulty badges help students choose appropriate challenges
- Estimated time helps with planning

### Step 5: Preview & Save
- Review the form to ensure all data is correct
- Submit to create the track with games

---

## Validation Best Practices

### ✅ Do:
- Provide clear, unambiguous questions
- Test your correct answers yourself
- Add multiple test cases for coding challenges
- Include helpful hints that guide without giving away the answer
- Write explanations that teach the concept
- Use realistic scenarios for threat games
- Provide complete connection lists for network games

### ❌ Don't:
- Use vague or ambiguous questions
- Provide only one test case (students might hardcode the answer)
- Make hints too obvious or too cryptic
- Forget to include all required connections/threats
- Use overly complex SQL for beginner levels
- Leave correctAnswer fields empty

---

## Common Issues & Solutions

### Issue: Students can't complete coding game
**Solution**: Check your test cases. Make sure `input` is an array and `expected` matches what your solution returns.

### Issue: Network game always fails
**Solution**: Check connection format. Must be exactly "Device1 -> Device2" with spaces around arrow.

### Issue: Threat game validation fails
**Solution**: Ensure `correctThreats` array contains exact matches (case-sensitive) to items in `options` array.

### Issue: SQL quiz doesn't accept correct queries
**Solution**: SQL validation is strict. Check for exact keyword matching and proper formatting.

---

## Testing Your Games

Before publishing a track:

1. **Create a test track** with your games
2. **Play through each game** as a student
3. **Try wrong answers** to ensure validation works
4. **Check hints display** correctly
5. **Verify explanations** show after completion

---

## Example: Complete Game Creation Workflow

```
1. Create Track: "Introduction to Networking"
2. Add Module: "Network Basics"
3. Add Lesson: "Understanding Network Devices"
4. Add Game: Type = "network"
   - Title: "Build Your First Network"
   - Description: "Connect PCs to internet through router and switch"
   - Devices: "PC1, PC2, Switch, Router, Modem"
   - Connections:
     * PC1 -> Switch
     * PC2 -> Switch  
     * Switch -> Router
     * Router -> Modem
   - Hints:
     * PCs connect to switch first
     * Router connects switch to modem
     * Modem provides internet access
5. Save and test!
```

---

## Need Help?

If you encounter issues creating games:
1. Check this guide for proper field formats
2. Review example games in existing tracks
3. Test with simple examples first
4. Gradually add complexity

Remember: Good games have clear instructions, appropriate difficulty, and helpful feedback! 🎮
