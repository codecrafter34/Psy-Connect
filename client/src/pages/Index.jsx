import Hero from "@/components/Hero";
import Navigation from "@/components/Navigation";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section id="home">
        <Hero />
      </section>
    </main>
  );
};

export default Index;
