const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedEvents() {
  console.log('Seeding events...');

  try {
    // Get IT Professional users to assign as event creators
    const itProfessionals = await prisma.user.findMany({
      where: { role: 'IT Professional' },
      take: 2
    });

    if (itProfessionals.length === 0) {
      console.log('No IT Professionals found. Skipping event seeding.');
      return;
    }

    const events = [
      {
        title: 'Introduction to Cloud Computing with AWS',
        description: 'Join us for an interactive workshop on Amazon Web Services fundamentals. Learn about EC2, S3, Lambda, and how to build scalable cloud applications. Perfect for beginners and those looking to expand their cloud knowledge.',
        type: 'workshop',
        startTime: new Date('2025-11-15T14:00:00Z'),
        endTime: new Date('2025-11-15T17:00:00Z'),
        location: 'Virtual',
        virtualLink: 'https://zoom.us/j/example1',
        capacity: 50,
        creatorId: itProfessionals[0].id,
        tags: ['aws', 'cloud', 'infrastructure', 'beginner'],
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
        status: 'published'
      },
      {
        title: 'React Advanced Patterns & Performance',
        description: 'Deep dive into advanced React concepts including hooks, context, performance optimization, and modern patterns. Bring your laptop and code along!',
        type: 'workshop',
        startTime: new Date('2025-11-20T10:00:00Z'),
        endTime: new Date('2025-11-20T16:00:00Z'),
        location: 'Tech Hub Conference Room A',
        capacity: 30,
        creatorId: itProfessionals[0].id,
        tags: ['react', 'javascript', 'frontend', 'performance'],
        imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
        status: 'published'
      },
      {
        title: 'Cybersecurity Career Panel',
        description: 'Hear from industry experts about career paths in cybersecurity. Network with professionals and learn about certifications, job opportunities, and the future of cyber defense.',
        type: 'networking',
        startTime: new Date('2025-11-25T18:00:00Z'),
        endTime: new Date('2025-11-25T20:00:00Z'),
        location: 'Virtual',
        virtualLink: 'https://zoom.us/j/example2',
        capacity: 100,
        creatorId: itProfessionals[1]?.id || itProfessionals[0].id,
        tags: ['cybersecurity', 'career', 'networking', 'panel'],
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop',
        status: 'published'
      },
      {
        title: 'AI/ML in Modern Web Development',
        description: 'Explore how artificial intelligence and machine learning are transforming web development. Learn about integrating AI APIs, building recommendation systems, and creating intelligent user experiences.',
        type: 'webinar',
        startTime: new Date('2025-12-01T15:00:00Z'),
        endTime: new Date('2025-12-01T16:30:00Z'),
        location: 'Virtual',
        virtualLink: 'https://zoom.us/j/example3',
        capacity: 200,
        creatorId: itProfessionals[0].id,
        tags: ['ai', 'machine-learning', 'web-development', 'apis'],
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
        status: 'published'
      },
      {
        title: 'Database Design & Optimization',
        description: 'Master the art of database design and performance optimization. Cover SQL vs NoSQL, indexing strategies, query optimization, and scaling techniques.',
        type: 'workshop',
        startTime: new Date('2025-12-05T13:00:00Z'),
        endTime: new Date('2025-12-05T17:00:00Z'),
        location: 'Innovation Center, Room 201',
        capacity: 40,
        creatorId: itProfessionals[1]?.id || itProfessionals[0].id,
        tags: ['database', 'sql', 'nosql', 'optimization'],
        imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=400&fit=crop',
        status: 'published'
      },
      {
        title: 'IT Career Fair 2025',
        description: 'Connect with top tech companies and explore exciting career opportunities. Meet recruiters, attend company presentations, and discover your next career move.',
        type: 'career_fair',
        startTime: new Date('2025-12-10T09:00:00Z'),
        endTime: new Date('2025-12-10T17:00:00Z'),
        location: 'Convention Center, Halls A&B',
        capacity: 500,
        creatorId: itProfessionals[0].id,
        tags: ['career', 'job-fair', 'networking', 'recruiting'],
        imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop',
        status: 'published'
      }
    ];

    for (const eventData of events) {
      await prisma.event.create({
        data: eventData
      });
    }

    console.log(`Seeded ${events.length} events successfully!`);
  } catch (error) {
    console.error('Error seeding events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEvents();