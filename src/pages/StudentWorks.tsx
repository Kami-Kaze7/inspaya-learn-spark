import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Award, ExternalLink, Heart } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";

const StudentWorks = () => {
  const aiProjects = [
    {
      id: 1,
      title: "AI-Powered Chatbot",
      student: "Sarah Johnson",
      description: "An intelligent customer service chatbot using natural language processing",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&h=300&fit=crop",
      likes: 142,
      category: "Machine Learning"
    },
    {
      id: 2,
      title: "Image Recognition System",
      student: "Michael Chen",
      description: "Deep learning model for medical image analysis and diagnosis",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&h=300&fit=crop",
      likes: 98,
      category: "Computer Vision"
    },
    {
      id: 3,
      title: "Predictive Analytics Dashboard",
      student: "Emily Rodriguez",
      description: "Real-time data visualization with ML-powered forecasting",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      likes: 156,
      category: "Data Science"
    }
  ];

  const motionGraphicsProjects = [
    {
      id: 4,
      title: "Brand Animation Package",
      student: "David Lee",
      description: "Complete animated brand identity for a tech startup",
      image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&h=300&fit=crop",
      likes: 203,
      category: "Branding"
    },
    {
      id: 5,
      title: "3D Product Visualization",
      student: "Lisa Anderson",
      description: "Stunning 3D motion graphics for product launch campaign",
      image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=500&h=300&fit=crop",
      likes: 187,
      category: "3D Animation"
    },
    {
      id: 6,
      title: "Music Video Effects",
      student: "James Wilson",
      description: "Creative motion graphics and visual effects for indie artist",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&h=300&fit=crop",
      likes: 234,
      category: "Music Video"
    }
  ];

  const videoEditingProjects = [
    {
      id: 7,
      title: "Documentary Short Film",
      student: "Aisha Rahman",
      description: "Powerful storytelling through expert editing and color grading",
      image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500&h=300&fit=crop",
      likes: 176,
      category: "Documentary"
    },
    {
      id: 8,
      title: "Corporate Promo Video",
      student: "Robert Taylor",
      description: "High-energy promotional content with dynamic transitions",
      image: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=500&h=300&fit=crop",
      likes: 145,
      category: "Commercial"
    },
    {
      id: 9,
      title: "Travel Vlog Series",
      student: "Maria Garcia",
      description: "Engaging travel content with cinematic editing style",
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&h=300&fit=crop",
      likes: 289,
      category: "Travel"
    }
  ];

  const ProjectCard = ({ project }: { project: any }) => (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/90 text-foreground">
            {project.category}
          </Badge>
        </div>
      </div>
      <CardHeader>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">
          {project.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          by {project.student}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="text-sm">{project.likes} likes</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            View Project
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'var(--gradient-hero-red)' }}>
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
              Our Students' Amazing Work
            </h1>
            <p className="text-lg text-white/90 md:text-xl">
              Explore the incredible projects created by our talented students across AI, Motion Graphics, and Video Editing courses
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="container mx-auto px-4 py-20">
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-12">
            <TabsTrigger value="ai">AI Courses</TabsTrigger>
            <TabsTrigger value="motion">Motion Graphics</TabsTrigger>
            <TabsTrigger value="video">Video Editing</TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">AI Course Projects</h2>
              <p className="text-muted-foreground">
                Innovative AI solutions and machine learning applications built by our students
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {aiProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="motion">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Motion Graphics Projects</h2>
              <p className="text-muted-foreground">
                Creative animations and stunning visual designs crafted by our motion graphics students
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {motionGraphicsProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="video">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Video Editing Projects</h2>
              <p className="text-muted-foreground">
                Professionally edited videos showcasing storytelling and technical excellence
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videoEditingProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-accent p-12 text-center text-primary-foreground shadow-2xl">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to Create Your Own Projects?</h2>
          <p className="mb-8 text-lg opacity-90">
            Join our courses and showcase your work to the world
          </p>
          <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl transition-shadow">
            Browse Courses
          </Button>
        </div>
      </section>
    </div>
  );
};

export default StudentWorks;
