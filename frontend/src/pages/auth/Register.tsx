import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import RegisterFirstStep from "@/components/RegisterForms/RegisterFirstStep";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-16 bg-gradient-stripe border-b border-border">
          <div className="container max-w-4xl">
            <h1 className="text-5xl font-bold mb-4">
              Join the <span className="text-primary">League</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Register as a fighter, sponsor, or donor to support the community.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container max-w-2xl">
            <RegisterFirstStep />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
