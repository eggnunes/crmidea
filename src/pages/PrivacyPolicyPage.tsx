import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

const PrivacyPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Política de Privacidade | Rafael Egg - IA para Advogados</title>
        <meta name="description" content="Política de Privacidade do site Rafael Egg. Saiba como coletamos, usamos e protegemos suas informações pessoais." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://rafaelegg.com/privacidade" />
      </Helmet>
      
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Política de Privacidade</CardTitle>
              <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
                <p className="text-muted-foreground">
                  Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais 
                  quando você utiliza nossos serviços de CRM e comunicação integrada com plataformas de mensagens.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Informações que Coletamos</h2>
                <p className="text-muted-foreground mb-2">Podemos coletar os seguintes tipos de informações:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Informações de identificação pessoal (nome, email, telefone)</li>
                  <li>Informações de perfil de redes sociais (quando você se conecta via Instagram ou Facebook)</li>
                  <li>Mensagens e conversas realizadas através de nossos canais integrados</li>
                  <li>Dados de uso e interação com nossos serviços</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Como Usamos suas Informações</h2>
                <p className="text-muted-foreground mb-2">Utilizamos suas informações para:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Fornecer e melhorar nossos serviços</li>
                  <li>Responder às suas mensagens e solicitações</li>
                  <li>Enviar comunicações relevantes sobre nossos produtos e serviços</li>
                  <li>Cumprir obrigações legais</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Compartilhamento de Dados</h2>
                <p className="text-muted-foreground">
                  Não vendemos suas informações pessoais. Podemos compartilhar dados com provedores de serviços 
                  terceirizados (como Meta/Facebook e Instagram) apenas na medida necessária para fornecer nossos serviços.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Integrações com Meta (Facebook e Instagram)</h2>
                <p className="text-muted-foreground">
                  Nosso aplicativo integra-se com os serviços da Meta (Facebook Messenger e Instagram Direct) para 
                  permitir comunicação com clientes. Ao usar essas integrações, você concorda com os termos de uso 
                  e política de privacidade da Meta.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Segurança dos Dados</h2>
                <p className="text-muted-foreground">
                  Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações 
                  contra acesso não autorizado, alteração, divulgação ou destruição.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Seus Direitos</h2>
                <p className="text-muted-foreground mb-2">Você tem direito a:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir dados incorretos</li>
                  <li>Solicitar a exclusão de seus dados</li>
                  <li>Revogar consentimento a qualquer momento</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Retenção de Dados</h2>
                <p className="text-muted-foreground">
                  Mantemos suas informações pelo tempo necessário para fornecer nossos serviços ou conforme 
                  exigido por lei. Você pode solicitar a exclusão de seus dados a qualquer momento.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Contato</h2>
                <p className="text-muted-foreground">
                  Para questões sobre esta política ou exercer seus direitos, entre em contato conosco 
                  através dos canais disponíveis em nosso site.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Alterações nesta Política</h2>
                <p className="text-muted-foreground">
                  Podemos atualizar esta política periodicamente. Recomendamos que você revise esta página 
                  regularmente para estar ciente de quaisquer alterações.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;