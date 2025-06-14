import Book from "../models/book.js";

export const handleMessage = async (req, res) => {
  try {
    const { message, userId, context } = req.body;
    
    // Fetch all books from database
    const books = await Book.find();
    
    // Process the message and generate response
    let response = await processMessage(message, books, context);
    
    res.json({ response });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function processMessage(message, books, context) {
  const lowerMessage = message.toLowerCase();
  
  // Greeting patterns
  if (lowerMessage.match(/^(hi|hello|hey|greetings)/i)) {
    return `# 👋 Hello! I'm your friendly book assistant!

I'd love to help you discover our wonderful collection of books. What would you like to know about?

*You can ask me about our categories, prices, authors, or specific books!*`;
  }

  // Check for category-related queries
  if (lowerMessage.includes('category') || lowerMessage.includes('categories')) {
    const categoryCounts = books.reduce((acc, book) => {
      acc[book.category] = (acc[book.category] || 0) + 1;
      return acc;
    }, {});

    const categoryDetails = Object.entries(categoryCounts)
      .map(([category, count]) => `- **${category}** (${count} books)`)
      .join('\n');

    return `# 📚 Our Book Categories

We have a diverse collection of books across ${context.categories.length} categories! Here's what we have:

${categoryDetails}

*Which category interests you the most? I can tell you more about specific books in any category!*`;
  }
  
  // Check for price-related queries
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    const priceRange = books.reduce((acc, book) => {
      acc.min = Math.min(acc.min, book.price);
      acc.max = Math.max(acc.max, book.price);
      return acc;
    }, { min: Infinity, max: -Infinity });

    const averagePrice = books.reduce((sum, book) => sum + book.price, 0) / books.length;
    
    return `# 💰 Our Book Pricing

## Price Range
- **Minimum Price:** EGP ${priceRange.min.toFixed(2)}
- **Maximum Price:** EGP ${priceRange.max.toFixed(2)}
- **Average Price:** EGP ${averagePrice.toFixed(2)}

*I can help you find books within your budget! What price range are you looking for?*`;
  }
  
  // Check for author-related queries
  if (lowerMessage.includes('author')) {
    const authors = [...new Set(books.map(book => book.author))].filter(author => author !== 'Unknown');
    const authorCounts = books.reduce((acc, book) => {
      if (book.author !== 'Unknown') {
        acc[book.author] = (acc[book.author] || 0) + 1;
      }
      return acc;
    }, {});

    const topAuthors = Object.entries(authorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([author, count]) => `- **${author}** (${count} books)`)
      .join('\n');

    return `# 📖 Our Authors

## Top Authors
${topAuthors}

*Would you like to know more about books from any specific author? I can help you find their works!*`;
  }
  
  // Check for stock-related queries
  if (lowerMessage.includes('stock') || lowerMessage.includes('available')) {
    const inStockBooks = books.filter(book => book.stock > 0);
    const lowStockBooks = books.filter(book => book.stock > 0 && book.stock <= 5);
    
    return `# 📚 Current Stock Status

## Inventory Overview
- **Total Books in Stock:** ${inStockBooks.length}
- **Low Stock Titles:** ${lowStockBooks.length} (5 or fewer copies)

*Would you like to know which books are available right now? I can help you find exactly what you're looking for!*`;
  }
  
  // Check for specific book queries
  if (lowerMessage.includes('book') || lowerMessage.includes('books')) {
    const totalBooks = books.length;
    const categories = [...new Set(books.map(book => book.category))];
    const inStockCount = books.filter(book => book.stock > 0).length;
    
    return `# 📚 Our Book Collection

## Collection Overview
- **Total Books:** ${totalBooks}
- **Categories:** ${categories.length}
- **Currently Available:** ${inStockCount}

## How I Can Help You
1. Browse by **Category**
2. Search by **Author**
3. Filter by **Price Range**
4. Check **Availability**

*Just let me know what you'd like to discover!*`;
  }

  // Check for help or what can you do queries
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return `# 🤖 How I Can Help You

## My Capabilities
1. **Book Categories**
   - Show all available categories
   - List books in each category

2. **Pricing Information**
   - Show price ranges
   - Find books in your budget

3. **Author Information**
   - List our authors
   - Show books by specific authors

4. **Stock Status**
   - Check book availability
   - Show low stock alerts

5. **Book Search**
   - Find specific books
   - Get detailed information

*Just ask me anything about our books, and I'll do my best to help! What would you like to know?*`;
  }
  
  // Default response for in-scope but unclear queries
  return `# 📚 Welcome to Our Book Collection!

## What I Can Help You With
1. **Book Categories** - Explore our diverse collection
2. **Prices & Offers** - Find books in your budget
3. **Authors** - Discover works by your favorite writers
4. **Availability** - Check what's in stock
5. **Specific Books** - Get details about any book

*What would you like to know? I'm here to help!*`;
} 