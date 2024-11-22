import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import styles from './About.module.scss';

export const About = () => {
    return (
        <div className={styles.aboutPage}>
            <div className="layout-max-width-small">
                <section>
                    <h1>About AG Grid</h1>
                </section>

                <section>
                    <article>
                        <br />
                        <p>
                            Born out of frustration with existing solutions, <strong>AG Grid</strong> evolved from a
                            side project to becoming the leading JavaScript datagrid on the market. We are a company
                            built by developers for developers, and - true to our roots - we offer{' '}
                            <strong>AG Grid Community</strong>: a free and open-source project that delivers world class
                            grid performance. <strong>AG Grid Enterprise</strong> is our commercially-licensed offering
                            which has enjoyed widespread adoption and facilitates us to keep delivering on our mission.
                        </p>
                        <p>
                            Today, <strong>AG Grid</strong> is a self-funded, bootstrapped company with thousands of
                            customers globally. Even though we've already created the world's best Javascript datagrid,
                            our work isn't over: we're forging ahead with the development of new features to show the
                            world what’s possible in a Javascript datagrid.
                        </p>
                    </article>
                </section>

                <section>
                    <h2>Our Principles</h2>

                    <article>
                        <p>
                            We believe that a datagrid should be framework-agnostic, providing developers with
                            flexibility and future-proofing their work. This philosophy is mirrored in our name; ‘AG'
                            stands for agnostic. Our experience is in building Enterprise applications: we know that the
                            datagrid is at the core of an Enterprise application, and needs to deliver performance and a
                            rich feature set. We pride ourselves on offering what others typically charge for.{' '}
                            <strong>AG Grid Community</strong> delivers features comparable to our competition, free of
                            charge.
                        </p>
                    </article>
                </section>

                <section>
                    <h2>The Product Team</h2>

                    <article className={styles.team}>
                        <div>
                            <img src={'/images/team/niall.jpg'} alt="Niall Crosby, CEO / Founder" />
                            <h3>Niall Crosby</h3>
                            <p>CEO / Founder</p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/rob.jpg')} alt="Rob Clarke, VP Engineering" />
                            <h3>Rob Clarke</h3>
                            <p>CTO</p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/sean.jpg')} alt="Sean Landsman, Lead Developer" />
                            <h3>Sean Landsman</h3>
                            <p>
                                Lead Developer,
                                <br />
                                Frameworks
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/gil.jpg')} alt="Guilherme Lopes, Lead Developer" />
                            <h3>Guilherme Lopes</h3>
                            <p>
                                Lead Developer,
                                <br />
                                UI
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/stephen.jpeg')} alt="Stephen Cooper, Developer" />
                            <h3>Stephen Cooper</h3>
                            <p>
                                Developer,
                                <br />
                                Grid Core
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/andy.jpg')} alt="Andrew Glazier, Developer" />
                            <h3>Andrew Glazier</h3>
                            <p>
                                Developer,
                                <br />
                                Grid Core
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/tak.png')} alt="Tak Tran, Developer" />
                            <h3>Tak Tran</h3>
                            <p>
                                Developer,
                                <br />
                                Grid Core
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/peter.jpg')} alt="Peter Reynolds, Developer" />
                            <h3>Peter Reynolds</h3>
                            <p>
                                Developer,
                                <br />
                                Grid Core
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/elias.jpg')} alt="Elias Malik, Developer" />
                            <h3>Elias Malik</h3>
                            <p>
                                Developer,
                                <br />
                                Grid Core
                            </p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/salvatore.jpg')}
                                alt="Salvatore Previti, Developer"
                            />
                            <h3>Salvatore Previti</h3>
                            <p>
                                Developer,
                                <br />
                                Grid Core
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/steph.jpg')} alt="Steph Meslin-Weber, Developer" />
                            <h3>Steph Meslin-Weber</h3>
                            <p>
                                Developer,
                                <br />
                                Grid Core
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/alanT.jpg')} alt="Alan Treadway, Developer" />
                            <h3>Alan Treadway</h3>
                            <p>
                                Lead Developer,
                                <br />
                                Data Visualisation
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/mana.jpeg')} alt="Mana Peirov, Developer" />
                            <h3>Mana Peirov</h3>
                            <p>
                                Developer,
                                <br />
                                Data Visualisation
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/ido.jpg')} alt="Ido Moshe, Developer" />
                            <h3>Ido Moshe</h3>
                            <p>
                                Developer,
                                <br />
                                Data Visualisation
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/oli.jpg')} alt="Oli Legat, Developer" />
                            <h3>Oli Legat</h3>
                            <p>
                                Developer,
                                <br />
                                Data Visualisation
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/jacob.jpg')} alt="Jacob Parker, Developer" />
                            <h3>Jacob Parker</h3>
                            <p>
                                Developer,
                                <br />
                                Data Visualisation
                            </p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/alberto.jpg')}
                                alt="Alberto Gutierrez, Head of Customer Services"
                            />
                            <h3>Alberto Gutierrez</h3>
                            <p>Head of Customer Services</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/kiril.jpg')}
                                alt="Kiril Matev, Technical Product Manager"
                            />
                            <h3>Kiril Matev</h3>
                            <p>Technical Product Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/david.jpg')}
                                alt="David Glickman, Technical Product Analyst"
                            />
                            <h3>David Glickman</h3>
                            <p>Technical Product Analyst</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/zoheil.jpg')}
                                alt="Zoheil Khaleqi, Technical Product Analyst"
                            />
                            <h3>Zoheil Khaleqi</h3>
                            <p>Technical Product Analyst</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/adamW.jpg')}
                                alt="Adam Wang, Technical Product Analyst"
                            />
                            <h3>Adam Wang</h3>
                            <p>Technical Product Analyst</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/hesam.jpg')}
                                alt="Hesam Yousefipour, Technical Product Analyst"
                            />
                            <h3>Hesam Yousefipour</h3>
                            <p>Technical Product Analyst</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/ava.jpg')}
                                alt="Ava Utting, Technical Product Analyst"
                            />
                            <h3>Ava Utting</h3>
                            <p>Technical Product Analyst</p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/viqas.jpg')} alt="Viqas Hussain, Lead Developer" />
                            <h3>Viqas Hussain</h3>
                            <p>
                                Lead Developer,
                                <br />
                                E-commerce
                            </p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/mark.jpg')} alt="Mark Durrant, Lead UX Designer" />
                            <h3>Mark Durrant</h3>
                            <p>Lead UX Designer</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/kyler.jpg')}
                                alt="Kyler Phillips, Lead UX Designer"
                            />
                            <h3>Kyler Phillips</h3>
                            <p>Product Designer</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/james.jpg')}
                                alt="James Swinton-Bland, Developer relations lead"
                            />
                            <h3>
                                James
                                <br />
                                Swinton-Bland
                            </h3>
                            <p>Developer Relations Lead</p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/abi.jpg')} alt="Abi Glazier, Developer relations" />
                            <h3>Abi Glazier</h3>
                            <p>Developer Relations</p>
                        </div>
                    </article>
                </section>

                <section>
                    <h2>The Operations Team</h2>

                    <article className={styles.team}>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/dimo.jpg')} alt="Dimo Iliev, Managing Director" />
                            <h3>Dimo Iliev</h3>
                            <p>Managing Director</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/simon.jpg')}
                                alt="Simon Kenny, Customer Experience Manager"
                            />
                            <h3>Simon Kenny</h3>
                            <p>Sales Director</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/nathan.jpeg')}
                                alt="Nathan Gauge-Klein, General Counsel"
                            />
                            <h3>
                                Nathan
                                <br />
                                Gauge-Klein
                            </h3>
                            <p>General Counsel</p>
                        </div>
                        <div>
                            <img src={urlWithBaseUrl('/images/team/levi.jpg')} alt="Levi Lopez, Contract Specialist" />
                            <h3>Levi Lopez</h3>
                            <p>Contract Specialist</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/victoria.jpeg')}
                                alt="Victoria Tennant, Head of Renewals Department"
                            />
                            <h3>Victoria Tennant</h3>
                            <p>Head of Renewals Department</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/dimple.jpg')}
                                alt="Dimple Unalkat, Head of Initials Department"
                            />
                            <h3>Dimple Unalkat</h3>
                            <p>Head of Initials Department</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/sachshell.png')}
                                alt="Sachshell Rhoden, Customer Experience Manager"
                            />
                            <h3>Sachshell Rhoden</h3>
                            <p>Sales Operations Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/alison.jpeg')}
                                alt="Alison Bunworth, Business Development Manager"
                            />
                            <h3>Alison Bunworth</h3>
                            <p>Business Development Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/kristian.jpg')}
                                alt="Kristian Gornik, Business Development Manager"
                            />
                            <h3>Kristian Gornik</h3>
                            <p>Business Development Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/jordan.jpeg')}
                                alt="Jordan Shekoni, Key Account Manager"
                            />
                            <h3>Jordan Shekoni</h3>
                            <p>Key Account Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/garryson.jpg')}
                                alt="Garryson Malondji, Key Account Manager"
                            />
                            <h3>Garryson Malondji</h3>
                            <p>Key Account Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/seweety.jpeg')}
                                alt="Seweety Kumar, Senior Renewals Team Manager"
                            />
                            <h3>Seweety Kumar</h3>
                            <p>Senior Renewals Team Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/laiyan.jpeg')}
                                alt="Laiyan Woo, Renewals Team Manager"
                            />
                            <h3>Laiyan Woo</h3>
                            <p>Renewals Team Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/amir.jpeg')}
                                alt="Amir Hussain, Renewals Team Manager"
                            />
                            <h3>Amir Hussain</h3>
                            <p>Renewals Team Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/robD.jpg')}
                                alt="Rob Dunkiert, Customer Experience Manager"
                            />
                            <h3>Rob Dunkiert</h3>
                            <p>Customer Experience Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/tobi.jpg')}
                                alt="Tobi Aguda, Customer Experience Manager"
                            />
                            <h3>Tobi Aguda</h3>
                            <p>Customer Experience Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/kylie.jpg')}
                                alt="Kylie Slevin, Customer Experience Manager"
                            />
                            <h3>Kylie Slevin</h3>
                            <p>Customer Experience Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/alexR.jpg')}
                                alt="Alex Russell, Customer Experience Manager"
                            />
                            <h3>Alex Russell</h3>
                            <p>Customer Experience Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/lex.jpg')}
                                alt="Alex Openshaw, Customer Experience Manager"
                            />
                            <h3>Alex Openshaw</h3>
                            <p>Customer Experience Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/jay.jpg')}
                                alt="Jay Thompson, Customer Experience Manager"
                            />
                            <h3>Jay Thompson</h3>
                            <p>Customer Experience Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/adamM.jpg')}
                                alt="Adam Mulcahy, Customer Experience Manager"
                            />
                            <h3>Adam Mulcahy</h3>
                            <p>Customer Experience Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/felicity.jpg')}
                                alt="Felicity Van Der Straaten, Customer Experience Manager"
                            />
                            <h3>
                                Felicity
                                <br />
                                Van Der Straaten
                            </h3>
                            <p>Customer Experience Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/sahib.jpg')}
                                alt="Sahib Singh, Customer Experience Manager"
                            />
                            <h3>Sahib Singh</h3>
                            <p>Customer Experience Manager</p>
                        </div>
                        <div>
                            <img
                                src={urlWithBaseUrl('/images/team/kathryn.png')}
                                alt="Kathryn Knapman, Board Executive Assistant"
                            />
                            <h3>Kathryn Knapman</h3>
                            <p>Board Executive Assistant</p>
                        </div>
                    </article>
                </section>

                <section>
                    <h2>Contact Us</h2>

                    <article className={styles.footer}>
                        <div>
                            <h3>Our Address</h3>
                            <address>
                                <strong>AG Grid Ltd.</strong>
                                <br />
                                Bank Chambers
                                <br />
                                6 Borough High Street
                                <br />
                                London
                                <br />
                                SE1 9QQ
                                <br />
                                United Kingdom
                            </address>
                            <p>
                                Email Enquiries: <a href="mailto:info@ag-grid.com">info@ag-grid.com</a>
                            </p>
                        </div>
                    </article>
                </section>
            </div>
        </div>
    );
};
