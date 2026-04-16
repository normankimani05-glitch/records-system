# Milk Production Tracker

A comprehensive milk production tracking system built with Next.js, TypeScript, and Supabase.

## Features

- **Milk Production Tracking**: Daily milk recording for morning and evening sessions
- **Price Management**: Dynamic pricing for Duke and Acarcia milk suppliers
- **Payment Tracking**: Monitor payments to suppliers with weekly/monthly summaries
- **User Management**: Role-based access (Owner, Staff, Veterinarian)
- **Veterinary Dashboard**: AI and treatment record management with image uploads
- **Analytics**: Charts and reports for production insights
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Supabase (PostgreSQL database, Authentication, Storage)
- **Charts**: Recharts for data visualization
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/milk-production-tracker.git
cd milk-production-tracker
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Add your Supabase credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Setup

Run the SQL scripts in the `scripts/` directory in order:

1. `scripts/setup-vet-database-complete.sql` - Create all tables
2. `scripts/fix-acarcia-upsert.sql` - Fix Acarcia pricing upsert

## Default Credentials

- **Owner**: Username: `owner`, Password: `owner123`
- **Staff**: Username: `staff`, Password: `staff123`
- **Vet**: Username: `vet`, Password: `vet123`

## Project Structure

```
├── app/                 # Next.js app directory
├── components/           # Reusable UI components
├── lib/                 # Database and utility functions
├── scripts/             # SQL database scripts
├── styles/              # Global styles
├── public/              # Static assets
└── milk-production-tracker.tsx  # Main application component
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to your fork
5. Submit a pull request

## License

MIT License
