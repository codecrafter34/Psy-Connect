import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Brain, TrendingUp, Shield } from "lucide-react";
import heroImage from "@/assets/hero-mindmirror.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col">
      {/* Hero Background */}
      <div className="absolute inset-0 bg-gradient-hero opacity-10" />
      
      {/* Main Hero Content */}
      <div className="relative flex-1 flex items-center">
        <div className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    MindMirror
                  </span>
                  <br />
                  <span className="text-foreground">
                    Understand Your Emotions
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Advanced AI-powered emotion recognition helps you track, understand, and improve your mental wellness through personalized insights.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-hero hover:shadow-medium transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Start Tracking
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary/20 hover:bg-gradient-calm transition-all duration-300"
                >
                  Learn More
                </Button>
              </div>
            </div>
            
            {/* Right Column - Hero Image */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-strong">
                <img 
                  src={heroImage} 
                  alt="MindMirror - Mental wellness through emotion tracking"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-wellness opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Preview */}
      <div className="relative bg-gradient-calm py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-8 w-8 text-primary" />}
              title="AI Emotion Detection"
              description="Advanced machine learning analyzes facial expressions to detect emotions in real-time."
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8 text-accent" />}
              title="Mood Analytics"
              description="Comprehensive insights and trends help you understand your emotional patterns."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-secondary-foreground" />}
              title="Private & Secure"
              description="Your emotional data stays private with end-to-end encryption and local processing."
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) => (
  <Card className="p-6 text-center border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-soft transition-all duration-300 hover:transform hover:scale-[1.02]">
    <div className="mb-4 flex justify-center">{icon}</div>
    <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </Card>
);

export default Hero;