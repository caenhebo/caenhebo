'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  RefreshCw, 
  FileText,
  TrendingUp,
  AlertCircle,
  Target
} from 'lucide-react'

interface Task {
  id: string
  title: string
  status: 'completed' | 'in-progress' | 'pending'
  category: string
  description?: string
  subtasks?: string[]
  completedDate?: string
  priority?: 'high' | 'medium' | 'low'
}

interface TaskSection {
  title: string
  tasks: Task[]
  overallProgress?: {
    completed: number
    total: number
    percentage: number
  }
}

interface TasksData {
  sections: TaskSection[]
  lastUpdated: string
}

export default function TasksManagement() {
  const [tasksData, setTasksData] = useState<TasksData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'in-progress' | 'pending'>('all')

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/tasks')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      setTasksData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={variants[status] || variants.pending}>
        {status.replace('-', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null
    
    const variants: Record<string, string> = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-orange-100 text-orange-800',
      'low': 'bg-blue-100 text-blue-800'
    }
    
    return (
      <Badge className={variants[priority] || ''} variant="outline">
        {priority} priority
      </Badge>
    )
  }

  const calculateOverallProgress = () => {
    if (!tasksData) return { completed: 0, total: 0, percentage: 0 }
    
    let totalTasks = 0
    let completedTasks = 0
    
    tasksData.sections.forEach(section => {
      section.tasks.forEach(task => {
        totalTasks++
        if (task.status === 'completed') completedTasks++
      })
    })
    
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    return { completed: completedTasks, total: totalTasks, percentage }
  }

  const filterTasks = (tasks: Task[]) => {
    if (selectedStatus === 'all') return tasks
    return tasks.filter(task => task.status === selectedStatus)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading tasks...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTasks} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const overallProgress = calculateOverallProgress()

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress.percentage}%</div>
            <Progress value={overallProgress.percentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {overallProgress.completed} of {overallProgress.total} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tasksData?.sections.reduce((acc, section) => 
                acc + section.tasks.filter(t => t.status === 'completed').length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tasks completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {tasksData?.sections.reduce((acc, section) => 
                acc + section.tasks.filter(t => t.status === 'in-progress').length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tasks in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Target className="h-4 w-4 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {tasksData?.sections.reduce((acc, section) => 
                acc + section.tasks.filter(t => t.status === 'pending').length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tasks pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tasks Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Development Tasks</CardTitle>
              <CardDescription>
                Track progress of all development tasks from markdown documentation
              </CardDescription>
            </div>
            <Button onClick={fetchTasks} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" onClick={() => setSelectedStatus('all')}>
                All Tasks
              </TabsTrigger>
              <TabsTrigger value="completed" onClick={() => setSelectedStatus('completed')}>
                Completed
              </TabsTrigger>
              <TabsTrigger value="in-progress" onClick={() => setSelectedStatus('in-progress')}>
                In Progress
              </TabsTrigger>
              <TabsTrigger value="pending" onClick={() => setSelectedStatus('pending')}>
                Pending
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus} className="mt-6">
              <Accordion type="single" collapsible className="w-full">
                {tasksData?.sections.map((section, sectionIndex) => {
                  const filteredTasks = filterTasks(section.tasks)
                  if (filteredTasks.length === 0 && selectedStatus !== 'all') return null
                  
                  return (
                    <AccordionItem key={sectionIndex} value={`section-${sectionIndex}`}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <span className="font-medium">{section.title}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {section.overallProgress && (
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={section.overallProgress.percentage} 
                                  className="w-24 h-2"
                                />
                                <span className="text-sm text-gray-500">
                                  {section.overallProgress.percentage}%
                                </span>
                              </div>
                            )}
                            <Badge variant="outline">
                              {filteredTasks.length} tasks
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-4">
                          {filteredTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="pt-1">
                                {getStatusIcon(task.status)}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <h4 className="font-medium">{task.title}</h4>
                                    {task.completedDate && (
                                      <p className="text-sm text-gray-500">
                                        Completed: {task.completedDate}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getPriorityBadge(task.priority)}
                                    {getStatusBadge(task.status)}
                                  </div>
                                </div>
                                
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {task.subtasks.map((subtask, idx) => (
                                      <div key={idx} className="text-sm text-gray-600 pl-4">
                                        {subtask}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
              
              {tasksData?.sections.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No tasks found in documentation files
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {tasksData?.lastUpdated && (
            <div className="mt-6 text-sm text-gray-500 text-center">
              Last updated: {new Date(tasksData.lastUpdated).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}