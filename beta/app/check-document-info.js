const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocumentInfo() {
  // Example: Get a transaction document with all related info
  const document = await prisma.document.findFirst({
    where: {
      transactionId: { not: null }
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      },
      transaction: {
        include: {
          property: {
            select: {
              code: true,
              title: true,
              address: true
            }
          },
          buyer: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          },
          seller: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });

  if (document) {
    console.log('Document Info:');
    console.log('- File URL:', document.fileUrl);
    console.log('- Uploaded by:', document.user?.email);
    console.log('\nProperty Info:');
    console.log('- Code:', document.transaction?.property.code);
    console.log('- Title:', document.transaction?.property.title);
    console.log('\nBuyer:', document.transaction?.buyer.firstName, document.transaction?.buyer.lastName);
    console.log('Seller:', document.transaction?.seller.firstName, document.transaction?.seller.lastName);
  } else {
    console.log('No transaction documents found');
  }
  
  await prisma.$disconnect();
}

checkDocumentInfo();
