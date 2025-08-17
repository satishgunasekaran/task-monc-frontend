import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import PageContainer from "@/components/layout/page-container";

export default async function PrivatePage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  return (
    <PageContainer>
      <div className="w-full">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Task Monc — Multi‑Project Todos
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Welcome{data.user?.email ? `, ${data.user.email}` : ""}
          </p>
          <p className="text-lg text-muted-foreground">
            Plan, prioritize, and track tasks across multiple projects.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mb-8 h-auto">
          <Card className="border-2 hover:border-primary/50 transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  ✅
                </div>
                Task Management
              </CardTitle>
              <CardDescription>
                Everything you need to manage todos across projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Multi‑project tasks with statuses and priorities</li>
                <li>• Due dates, tags, and assignees</li>
                <li>• Board and Table views</li>
                <li>• Drag & drop ordering</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  🗂️
                </div>
                Projects & Collaboration
              </CardTitle>
              <CardDescription>
                Organize work by project and team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Create and manage multiple projects</li>
                <li>• Invite teammates and assign tasks</li>
                <li>• Filter by project, status, or assignee</li>
                <li>• Real‑time updates</li>
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
                A quick path to your first tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Create a Project</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Projects and create one to group your tasks.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Add Your Tasks</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the New Task button to capture what needs doing.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Organize & Prioritize</h4>
                  <p className="text-sm text-muted-foreground">
                    Set priority, due date, and drag to reorder on the board.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Track Progress</h4>
                  <p className="text-sm text-muted-foreground">
                    Move tasks across columns as work progresses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  📊
                </div>
                Analytics — Coming Soon
              </CardTitle>
              <CardDescription>
                Insights to help you and your team work smarter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Burn‑down and throughput charts</li>
                <li>• Cycle time and lead time metrics</li>
                <li>• Project health summaries</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  🏅
                </div>
                Productivity Score — Coming Soon
              </CardTitle>
              <CardDescription>
                A simple, fair score that reflects momentum and focus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Weighted completion and on‑time delivery</li>
                <li>• Personal and team trends</li>
                <li>• Actionable recommendations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
