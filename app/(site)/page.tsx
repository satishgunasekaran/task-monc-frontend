import { ModeToggle } from '@/components/ui/theme-toggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'

export default async function PrivatePage() {
    const supabase = await createClient()

    const { data } = await supabase.auth.getUser()

    return (
        <div className="bg-background w-full">
            <div className="fixed top-4 right-4 z-50">
                <ModeToggle />
            </div>
            
            <div className="w-full px-6 py-8">
                <div className="w-full max-w-none">
                    {/* Welcome Section */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Welcome to Task Monc
                        </h1>
                        <p className="text-xl text-muted-foreground mb-2">
                            Hello {data.user?.email}
                        </p>
                        <p className="text-lg text-muted-foreground">
                            Your intelligent chat companion powered by AI and MCP servers
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mb-8 h-auto">
                        <Card className="border-2 hover:border-primary/50 transition-colors h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        💬
                                    </div>
                                    Chat with AI
                                </CardTitle>
                                <CardDescription>
                                    Engage in intelligent conversations with advanced AI models
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>• Natural language conversations</li>
                                    <li>• Context-aware responses</li>
                                    <li>• Multiple AI model support</li>
                                    <li>• Real-time chat experience</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-2 hover:border-primary/50 transition-colors h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        🔌
                                    </div>
                                    MCP Server Integration
                                </CardTitle>
                                <CardDescription>
                                    Connect and manage Model Context Protocol servers
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>• Add custom MCP servers</li>
                                    <li>• Extend AI capabilities</li>
                                    <li>• Tool and resource integration</li>
                                    <li>• Seamless server management</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-2 hover:border-primary/50 transition-colors h-full lg:col-span-1 md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        🚀
                                    </div>
                                    Getting Started
                                </CardTitle>
                                <CardDescription>
                                    Ready to begin your conversation? Here's what you can do:
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Start Chatting</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Use the sidebar to navigate to different chat rooms or start a new conversation.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Configure MCP</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Add MCP servers to enhance your AI assistant with additional tools and capabilities.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}