import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.notification.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.provider.deleteMany();
    await prisma.user.deleteMany();

    // Hash password for all test users
    const hashedPassword = await bcrypt.hash('123456789', 12);

    // Create admin user
    console.log('👨‍💼 Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador BarberPro',
        email: 'admin@barberpro.com.ar',
        password: hashedPassword,
        phone: '+54-11-1234-5678',
        role: UserRole.ADMIN,
        dni: '12.345.678',
        cuit: '20-12345678-9',
        isVerified: true,
        timezone: 'America/Argentina/Buenos_Aires',
        locale: 'es-AR'
      }
    });

    // Create client users
    console.log('👥 Creating client users...');
    const clients = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Juan Pérez',
          email: 'juan.perez@email.com',
          password: hashedPassword,
          phone: '+54-11-2345-6789',
          role: UserRole.CLIENT,
          dni: '23.456.789',
          birthDate: new Date('1990-05-15'),
          isVerified: true,
          timezone: 'America/Argentina/Buenos_Aires',
          locale: 'es-AR'
        }
      }),
      prisma.user.create({
        data: {
          name: 'María González',
          email: 'maria.gonzalez@email.com',
          password: hashedPassword,
          phone: '+54-11-3456-7890',
          role: UserRole.CLIENT,
          dni: '34.567.890',
          birthDate: new Date('1985-08-22'),
          isVerified: true,
          timezone: 'America/Argentina/Buenos_Aires',
          locale: 'es-AR'
        }
      }),
      prisma.user.create({
        data: {
          name: 'Carlos Rodríguez',
          email: 'carlos.rodriguez@email.com',
          password: hashedPassword,
          phone: '+54-11-4567-8901',
          role: UserRole.CLIENT,
          dni: '45.678.901',
          birthDate: new Date('1992-12-03'),
          isVerified: true,
          timezone: 'America/Argentina/Buenos_Aires',
          locale: 'es-AR'
        }
      })
    ]);

    // Create provider users and their businesses
    console.log('💇‍♂️ Creating provider users and barbershops...');
    
    // Provider 1: Classic Barbershop
    const provider1User = await prisma.user.create({
      data: {
        name: 'Roberto Silva',
        email: 'roberto.silva@barberpro.com.ar',
        password: hashedPassword,
        phone: '+54-11-5678-9012',
        role: UserRole.PROVIDER,
        dni: '56.789.012',
        cuit: '20-56789012-3',
        isVerified: true,
        timezone: 'America/Argentina/Buenos_Aires',
        locale: 'es-AR'
      }
    });

    const provider1 = await prisma.provider.create({
      data: {
        userId: provider1User.id,
        businessName: 'Barbería Clásica Roberto',
        description: 'Barbería tradicional con más de 20 años de experiencia en el barrio. Especialistas en cortes clásicos y afeitado tradicional con navaja.',
        address: 'Av. Corrientes 1234',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
        country: 'Argentina',
        postalCode: 'C1043',
        businessPhone: '+54-11-5678-9012',
        businessEmail: 'contacto@barberiaroberto.com.ar',
        taxId: '20-56789012-3',
        businessType: 'Barbería',
        isVerified: true,
        isActive: true,
        latitude: -34.6037,
        longitude: -58.3816,
        workingHours: {
          monday: { open: '09:00', close: '19:00', isOpen: true },
          tuesday: { open: '09:00', close: '19:00', isOpen: true },
          wednesday: { open: '09:00', close: '19:00', isOpen: true },
          thursday: { open: '09:00', close: '19:00', isOpen: true },
          friday: { open: '09:00', close: '20:00', isOpen: true },
          saturday: { open: '08:00', close: '18:00', isOpen: true },
          sunday: { isOpen: false }
        }
      }
    });

    // Provider 2: Modern Salon
    const provider2User = await prisma.user.create({
      data: {
        name: 'Andrea Morales',
        email: 'andrea.morales@barberpro.com.ar',
        password: hashedPassword,
        phone: '+54-11-6789-0123',
        role: UserRole.PROVIDER,
        dni: '67.890.123',
        cuit: '27-67890123-4',
        isVerified: true,
        timezone: 'America/Argentina/Buenos_Aires',
        locale: 'es-AR'
      }
    });

    const provider2 = await prisma.provider.create({
      data: {
        userId: provider2User.id,
        businessName: 'Modern Style Salon',
        description: 'Salón moderno especializado en cortes de vanguardia, coloración y tratamientos capilares. Ambiente relajado y técnicas innovadoras.',
        address: 'Av. Santa Fe 2567',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
        country: 'Argentina',
        postalCode: 'C1123',
        businessPhone: '+54-11-6789-0123',
        businessEmail: 'contacto@modernstyle.com.ar',
        website: 'https://modernstyle.com.ar',
        taxId: '27-67890123-4',
        businessType: 'Salón de Belleza',
        isVerified: true,
        isActive: true,
        latitude: -34.5956,
        longitude: -58.3837,
        workingHours: {
          monday: { open: '10:00', close: '20:00', isOpen: true },
          tuesday: { open: '10:00', close: '20:00', isOpen: true },
          wednesday: { open: '10:00', close: '20:00', isOpen: true },
          thursday: { open: '10:00', close: '21:00', isOpen: true },
          friday: { open: '10:00', close: '21:00', isOpen: true },
          saturday: { open: '09:00', close: '19:00', isOpen: true },
          sunday: { open: '10:00', close: '18:00', isOpen: true }
        }
      }
    });

    // Create services for each provider
    console.log('✂️ Creating services...');
    
    // Services for Barbería Clásica Roberto
    const classicServices = await Promise.all([
      prisma.service.create({
        data: {
          name: 'Corte Clásico',
          description: 'Corte tradicional con tijera y máquina. Incluye lavado y peinado.',
          duration: 30,
          price: 2500.00,
          category: 'Corte',
          providerId: provider1.id,
          images: []
        }
      }),
      prisma.service.create({
        data: {
          name: 'Corte + Barba',
          description: 'Corte completo más arreglo de barba. Incluye lavado y productos de acabado.',
          duration: 45,
          price: 3500.00,
          category: 'Corte y Barba',
          providerId: provider1.id,
          images: []
        }
      }),
      prisma.service.create({
        data: {
          name: 'Afeitado Tradicional',
          description: 'Afeitado clásico con navaja, toallas calientes y productos premium.',
          duration: 30,
          price: 2000.00,
          category: 'Afeitado',
          providerId: provider1.id,
          images: []
        }
      }),
      prisma.service.create({
        data: {
          name: 'Servicio Completo',
          description: 'Corte + barba + afeitado + lavado. La experiencia completa de barbería.',
          duration: 60,
          price: 4500.00,
          category: 'Servicio Completo',
          providerId: provider1.id,
          images: []
        }
      })
    ]);

    // Services for Modern Style Salon
    const modernServices = await Promise.all([
      prisma.service.create({
        data: {
          name: 'Corte Moderno',
          description: 'Corte de vanguardia con técnicas modernas. Incluye consultoría de estilo.',
          duration: 40,
          price: 3000.00,
          category: 'Corte',
          providerId: provider2.id,
          images: []
        }
      }),
      prisma.service.create({
        data: {
          name: 'Corte + Styling',
          description: 'Corte moderno + peinado profesional con productos de alta gama.',
          duration: 50,
          price: 4000.00,
          category: 'Corte y Peinado',
          providerId: provider2.id,
          images: []
        }
      }),
      prisma.service.create({
        data: {
          name: 'Coloración',
          description: 'Coloración profesional con productos premium. Incluye corte y peinado.',
          duration: 90,
          price: 6000.00,
          category: 'Coloración',
          providerId: provider2.id,
          images: []
        }
      }),
      prisma.service.create({
        data: {
          name: 'Tratamiento Capilar',
          description: 'Tratamiento intensivo para el cuidado del cabello. Hidratación y nutrición profunda.',
          duration: 60,
          price: 3500.00,
          category: 'Tratamiento',
          providerId: provider2.id,
          images: []
        }
      })
    ]);

    // Create sample bookings
    console.log('📅 Creating sample bookings...');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await Promise.all([
      // Confirmed booking for tomorrow
      prisma.booking.create({
        data: {
          clientId: clients[0].id,
          serviceId: classicServices[0].id,
          providerId: provider1.id,
          startTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
          endTime: new Date(tomorrow.setHours(10, 30, 0, 0)),
          status: 'CONFIRMED',
          totalAmount: 2500.00,
          notes: 'Cliente prefiere corte no tan corto',
          paymentStatus: 'PENDING',
          paymentMethod: 'cash'
        }
      }),
      // Pending booking for next week
      prisma.booking.create({
        data: {
          clientId: clients[1].id,
          serviceId: modernServices[1].id,
          providerId: provider2.id,
          startTime: new Date(nextWeek.setHours(15, 0, 0, 0)),
          endTime: new Date(nextWeek.setHours(15, 50, 0, 0)),
          status: 'PENDING',
          totalAmount: 4000.00,
          notes: 'Primera vez en el salón',
          paymentStatus: 'PENDING',
          paymentMethod: 'mercadopago'
        }
      }),
      // Completed booking (past)
      prisma.booking.create({
        data: {
          clientId: clients[2].id,
          serviceId: classicServices[2].id,
          providerId: provider1.id,
          startTime: new Date(today.setDate(today.getDate() - 1)),
          endTime: new Date(today.setDate(today.getDate() - 1) + 30 * 60 * 1000),
          status: 'COMPLETED',
          totalAmount: 2000.00,
          paymentStatus: 'PAID',
          paymentMethod: 'cash'
        }
      })
    ]);

    console.log('✅ Database seed completed successfully!');
    console.log('\n📊 Created:');
    console.log(`  - 1 Admin user (admin@barberpro.com.ar)`);
    console.log(`  - 3 Client users`);
    console.log(`  - 2 Provider users with barbershops`);
    console.log(`  - 8 Services (4 per provider)`);
    console.log(`  - 3 Sample bookings`);
    console.log('\n🔑 Default password for all users: 123456789');
    console.log('\n🏪 Sample businesses:');
    console.log(`  - Barbería Clásica Roberto (Av. Corrientes 1234)`);
    console.log(`  - Modern Style Salon (Av. Santa Fe 2567)`);

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });