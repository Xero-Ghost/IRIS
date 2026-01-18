import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';
import {
    TrendingUp,
    Bell,
    Radio,
    AlertTriangle,
    BarChart3,
    Navigation,
    Camera,
    Settings,
    Activity,
    Zap,
    CheckCircle,
    ArrowRight,
    Clock,
    Users,
    Menu,
    X,
    Eye,
    Cpu,
    Globe,
    Target,
    Lightbulb,
    Code,
    Database,
    ChevronDown,
    Award,
    TrendingDown,
    Car,
    Truck,
    MapPin
} from 'lucide-react';

export default function Landing() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setMobileMenuOpen(false);
        }
    };

    const features = [
        {
            icon: <Activity className="w-8 h-8" />,
            title: "Live Traffic Monitoring",
            description: "Real-time visualization of traffic density and flow across all intersections with AI-powered predictive analytics."
        },
        {
            icon: <Navigation className="w-8 h-8" />,
            title: "Green Corridor System",
            description: "Automated signal clearance for emergency vehicles like ambulances, ensuring faster response times."
        },
        {
            icon: <Radio className="w-8 h-8" />,
            title: "Smart Signal Controls",
            description: "AI-based adaptive traffic lights that automatically adjust timing based on real-time conditions."
        },
        {
            icon: <Bell className="w-8 h-8" />,
            title: "Traffic Alerts",
            description: "Instant notifications for accidents, congestion, and system anomalies with automated dispatch."
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "Advanced Analytics",
            description: "Data-driven dashboards with trend analysis and comprehensive reporting for traffic planning."
        },
        {
            icon: <AlertTriangle className="w-8 h-8" />,
            title: "Accident Detection",
            description: "AI-powered automatic accident detection with immediate emergency service notification."
        }
    ];

    const impacts = [
        { icon: <TrendingDown className="w-10 h-10" />, title: "Reduced Congestion", description: "Decrease in traffic jams through intelligent signal optimization" },
        { icon: <Truck className="w-10 h-10" />, title: "Faster Emergency", description: "Green corridor ensures ambulances reach faster" },
        { icon: <Car className="w-10 h-10" />,  title: "Lower Emissions", description: "Reduced idle time means cleaner air" },
        { icon: <Clock className="w-10 h-10" />, title: "Time Saved", description: "Commuters save time with optimized flow" }
    ];

    const journey = [
        { step: "01", title: "Problem Identification", description: "Identified critical traffic challenges - congestion, delayed emergency response, inefficient signals.", icon: <Target className="w-6 h-6" /> },
        { step: "02", title: "Research & Planning", description: "Extensive research on AI/ML, computer vision, and smart city infrastructure.", icon: <Lightbulb className="w-6 h-6" /> },
        { step: "03", title: "Development", description: "Built using YOLO for detection, Python backend, and React dashboard.", icon: <Code className="w-6 h-6" /> },
        { step: "04", title: "Testing", description: "Rigorous testing with simulated traffic scenarios and real-world data.", icon: <Settings className="w-6 h-6" /> },
        { step: "05", title: "Deployment Ready", description: "Fully functional prototype ready for smart city integration.", icon: <Award className="w-6 h-6" /> }
    ];

    const techStack = [
        { name: "YOLO v11", desc: "Vehicle Detection", icon: <Eye className="w-6 h-6" /> },
        { name: "Python", desc: "Backend", icon: <Code className="w-6 h-6" /> },
        { name: "React", desc: "Frontend", icon: <Globe className="w-6 h-6" /> },
        { name: "OpenCV", desc: "Image Processing", icon: <Camera className="w-6 h-6" /> },
        { name: "TensorFlow", desc: "AI/ML", icon: <Cpu className="w-6 h-6" /> },
        { name: "Real-time DB", desc: "Live Sync", icon: <Database className="w-6 h-6" /> }
    ];

    const faqs = [
        { question: "What is IRIS?", answer: "IRIS (Intelligent Roadways Infrastructure System) is an AI-powered smart traffic management platform that uses computer vision and machine learning to optimize traffic flow, manage signal timing, and prioritize emergency vehicles in real-time." },
        { question: "How does the Green Corridor work?", answer: "When an emergency vehicle is detected, IRIS automatically creates a 'green corridor' by coordinating traffic signals along the vehicle's route, turning them green to ensure fastest possible passage." },
        { question: "What technology powers IRIS?", answer: "IRIS uses YOLO v11 for real-time vehicle detection, Python for backend processing, React for the dashboard, and custom AI models for predictive analytics." },
        { question: "Can IRIS integrate with existing infrastructure?", answer: "Yes, IRIS is designed with modular architecture that can integrate with existing traffic cameras and signal systems, making it cost-effective to deploy." }
    ];

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-container">
                    <div className="nav-logo" onClick={() => scrollToSection('home')}>
                        <div className="logo-icon">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="logo-text">
                            <span className="logo-name">IRIS</span>
                            <span className="logo-tagline">Intelligent Roadways Infrastructure System</span>
                        </div>
                    </div>

                    <div className="nav-links">
                        <button onClick={() => scrollToSection('home')}>Home</button>
                        <button onClick={() => scrollToSection('about')}>About</button>
                        <button onClick={() => scrollToSection('features')}>Features</button>
                        <button onClick={() => scrollToSection('impact')}>Impact</button>
                        <button onClick={() => scrollToSection('journey')}>Journey</button>
                        <button onClick={() => scrollToSection('faq')}>FAQ</button>
                    </div>

                    <Link to="/login" className="nav-login-btn">
                        Login <ArrowRight className="w-4 h-4" />
                    </Link>

                    <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="mobile-menu">
                        <button onClick={() => scrollToSection('home')}>Home</button>
                        <button onClick={() => scrollToSection('about')}>About</button>
                        <button onClick={() => scrollToSection('features')}>Features</button>
                        <button onClick={() => scrollToSection('impact')}>Impact</button>
                        <button onClick={() => scrollToSection('journey')}>Journey</button>
                        <button onClick={() => scrollToSection('faq')}>FAQ</button>
                        <Link to="/login" className="mobile-login-btn">Login</Link>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section id="home" className="hero-section">
                <div className="hero-bg">
                    <div className="hero-blob blob-1"></div>
                    <div className="hero-blob blob-2"></div>
                    <div className="hero-blob blob-3"></div>
                </div>

                <div className="hero-content">
                    <div className="hero-badge">
                        <Zap className="w-4 h-4" />
                        <span>AI-Powered Smart City Solution</span>
                    </div>

                    <h1 className="hero-title">
                        Intelligent Roadways
                        <span className="gradient-text"> Infrastructure System</span>
                    </h1>

                    <p className="hero-description">
                        Revolutionizing urban traffic management with AI-powered real-time monitoring,
                        smart signal control, and emergency vehicle prioritization for smarter, safer cities.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/login" className="btn-primary">
                            Get Started <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button onClick={() => scrollToSection('about')} className="btn-secondary">
                            Learn More
                        </button>
                    </div>

                    <div className="hero-stats">
                        <div className="stat-item">
                            <div className="stat-value">v1.0</div>
                            <div className="stat-label">Prototype</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <div className="stat-value">AI</div>
                            <div className="stat-label">Powered</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <div className="stat-value">&lt;2s</div>
                            <div className="stat-label">Response</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <div className="stat-value">Live</div>
                            <div className="stat-label">Monitoring</div>
                        </div>
                    </div>
                </div>

                <div className="scroll-indicator" onClick={() => scrollToSection('about')}>
                    <ChevronDown className="w-6 h-6" />
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about-section">
                <div className="section-container">
                    <div className="about-grid">
                        <div className="about-content">
                            <span className="section-badge">About IRIS</span>
                            <h2 className="section-title">
                                What is <span className="gradient-text">IRIS</span>?
                            </h2>
                            <p className="about-text">
                                <strong>IRIS (Intelligent Roadways Infrastructure System)</strong> is a next-generation
                                AI-powered traffic management platform designed for smart cities. It combines
                                cutting-edge computer vision, machine learning, and real-time data processing
                                to transform how cities manage their traffic infrastructure.
                            </p>
                            <p className="about-text">
                                Our system monitors traffic flow in real-time, automatically optimizes signal
                                timing, detects accidents instantly, and creates emergency corridors for
                                ambulances and fire trucks - all powered by artificial intelligence.
                            </p>

                            <div className="about-features">
                                <div className="about-feature">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Real-time AI Processing</span>
                                </div>
                                <div className="about-feature">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Computer Vision Detection</span>
                                </div>
                                <div className="about-feature">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Predictive Analytics</span>
                                </div>
                                <div className="about-feature">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Emergency Prioritization</span>
                                </div>
                            </div>
                        </div>

                        <div className="about-visual">
                            <div className="visual-card">
                                <div className="visual-icon">
                                    <Eye className="w-12 h-12" />
                                </div>
                                <h3>Computer Vision</h3>
                                <p>YOLO-powered vehicle detection</p>
                            </div>
                            <div className="visual-card">
                                <div className="visual-icon">
                                    <Cpu className="w-12 h-12" />
                                </div>
                                <h3>AI Processing</h3>
                                <p>Real-time decision making</p>
                            </div>
                            <div className="visual-card">
                                <div className="visual-icon">
                                    <Globe className="w-12 h-12" />
                                </div>
                                <h3>Smart Integration</h3>
                                <p>City infrastructure connectivity</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">Features</span>
                        <h2 className="section-title">
                            Powerful <span className="gradient-text">Capabilities</span>
                        </h2>
                        <p className="section-subtitle">
                            Everything traffic authorities need to monitor, analyze, and control city-wide traffic
                        </p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature, idx) => (
                            <div key={idx} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                                <div className="feature-footer">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Available</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section id="impact" className="impact-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">Impact</span>
                        <h2 className="section-title">
                            Making Cities <span className="gradient-text">Better</span>
                        </h2>
                        <p className="section-subtitle">Real impact on urban mobility, safety, and environment</p>
                    </div>

                    <div className="impact-grid">
                        {impacts.map((impact, idx) => (
                            <div key={idx} className="impact-card">
                                <div className="impact-icon">{impact.icon}</div>
                                <div className="impact-stat">{impact.stat}</div>
                                <h3>{impact.title}</h3>
                                <p>{impact.description}</p>
                            </div>
                        ))}40
                    </div>

                    <div className="use-cases">
                        <h3>Use Cases</h3>
                        <div className="use-cases-grid">
                            <div className="use-case">
                                <MapPin className="w-6 h-6" />
                                <div>
                                    <h4>Smart Cities</h4>
                                    <p>Integrated traffic management for modern urban centers</p>
                                </div>
                            </div>
                            <div className="use-case">
                                <Truck className="w-6 h-6" />
                                <div>
                                    <h4>Emergency Services</h4>
                                    <p>Priority routing for ambulances, fire trucks, and police</p>
                                </div>
                            </div>
                            <div className="use-case">
                                <Users className="w-6 h-6" />
                                <div>
                                    <h4>Public Transport</h4>
                                    <p>Optimized bus timings and reduced commuter wait times</p>
                                </div>
                            </div>
                            <div className="use-case">
                                <BarChart3 className="w-6 h-6" />
                                <div>
                                    <h4>Urban Planning</h4>
                                    <p>Data-driven insights for infrastructure development</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Journey Section */}
            <section id="journey" className="journey-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">Our Journey</span>
                        <h2 className="section-title">
                            How We <span className="gradient-text">Built It</span>
                        </h2>
                        <p className="section-subtitle">From concept to a fully functional smart traffic management system</p>
                    </div>

                    <div className="journey-timeline">
                        {journey.map((step, idx) => (
                            <div key={idx} className="timeline-item">
                                <div className="timeline-marker"><span>{step.step}</span></div>
                                <div className="timeline-content">
                                    <div className="timeline-icon">{step.icon}</div>
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="tech-stack">
                        <h3>Technology Stack</h3>
                        <div className="tech-grid">
                            {techStack.map((tech, idx) => (
                                <div key={idx} className="tech-item">
                                    <div className="tech-icon">{tech.icon}</div>
                                    <div className="tech-info">
                                        <h4>{tech.name}</h4>
                                        <p>{tech.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="faq-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">FAQ</span>
                        <h2 className="section-title">
                            Frequently Asked <span className="gradient-text">Questions</span>
                        </h2>
                    </div>

                    <div className="faq-list">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className={`faq-item ${activeAccordion === idx ? 'active' : ''}`} onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}>
                                <div className="faq-question">
                                    <h3>{faq.question}</h3>
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                                <div className="faq-answer"><p>{faq.answer}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="section-container">
                    <div className="cta-content">
                        <h2>Ready to Transform Your City's Traffic?</h2>
                        <p>Experience the future of intelligent traffic management with IRIS</p>
                        <Link to="/login" className="btn-primary btn-large">
                            Get Started Now <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="section-container">
                    <div className="footer-bottom">
                        <p>&copy; 2026 IRIS - Intelligent Roadway Infrastructure System. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}