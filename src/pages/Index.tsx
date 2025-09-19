import Hero from "@/components/Hero";
import Dashboard from "@/components/Dashboard";
import Navigation from "@/components/Navigation";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section id="home">
        <Hero />
      </section>
      
      {/* Dashboard Section */}
      <section id="dashboard" className="py-16">
        <div className="container mx-auto px-6 mb-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">
              Your Personal Wellness
              <span className="bg-gradient-hero bg-clip-text text-transparent ml-2">
                Command Center
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time emotion analysis with AI-powered insights to help you understand and improve your mental wellness journey.
            </p>
          </div>
        </div>
        <Dashboard />
      </section>
    </main>
  );
};

export default Index;
