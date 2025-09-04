import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import fs from 'fs/promises'
import path from 'path'

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Read the markdown files
    const projectRoot = path.join(process.cwd(), '..')
    const tasksFiles = [
      {
        path: path.join(projectRoot, 'caenhebotasks.md'),
        name: 'Main Tasks'
      },
      {
        path: path.join(process.cwd(), 'PROPERTY_MANAGEMENT_IMPLEMENTATION.md'),
        name: 'Property Management'
      }
    ]

    const allTasks: TaskSection[] = []

    for (const file of tasksFiles) {
      try {
        const content = await fs.readFile(file.path, 'utf-8')
        const parsed = parseMarkdownTasks(content, file.name)
        allTasks.push(...parsed)
      } catch (error) {
        console.error(`Error reading ${file.path}:`, error)
      }
    }

    return NextResponse.json({
      sections: allTasks,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

function parseMarkdownTasks(content: string, fileName: string): TaskSection[] {
  const sections: TaskSection[] = []
  const lines = content.split('\n')
  
  let currentSection: TaskSection | null = null
  let currentTask: Task | null = null
  let taskIdCounter = 1

  // Extract overall progress if present
  const progressMatch = content.match(/Overall Progress:\s*(\d+)%\s*Complete\s*\((\d+)\/(\d+)/i)
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check for section headers
    if (line.startsWith('## ')) {
      if (currentSection && currentSection.tasks.length > 0) {
        sections.push(currentSection)
      }
      
      const sectionTitle = line.replace('##', '').trim()
      currentSection = {
        title: `${fileName} - ${sectionTitle}`,
        tasks: []
      }
      
      if (progressMatch && sectionTitle.includes('Completed') || sectionTitle.includes('Progress')) {
        currentSection.overallProgress = {
          completed: parseInt(progressMatch[2]),
          total: parseInt(progressMatch[3]),
          percentage: parseInt(progressMatch[1])
        }
      }
    }
    
    // Check for task items
    if (line.startsWith('### ')) {
      const taskTitle = line.replace('###', '').trim()
      const status = taskTitle.includes('✅') ? 'completed' : 
                     taskTitle.includes('🔄') ? 'in-progress' : 'pending'
      
      currentTask = {
        id: `task-${fileName}-${taskIdCounter++}`,
        title: taskTitle.replace(/[✅❌🔄]/g, '').trim(),
        status,
        category: currentSection?.title || 'Uncategorized',
        subtasks: []
      }
      
      if (currentSection) {
        currentSection.tasks.push(currentTask)
      }
    }
    
    // Check for subtasks
    if (line.startsWith('- [') && currentTask) {
      const isChecked = line.includes('[x]')
      const subtaskText = line.replace(/- \[[x ]\]/i, '').trim()
      currentTask.subtasks?.push(`${isChecked ? '✓' : '○'} ${subtaskText}`)
    }
    
    // Check for completion date
    if (line.includes('Completed:') && currentTask) {
      const dateMatch = line.match(/Completed:\s*(\d{4}-\d{2}-\d{2})/)
      if (dateMatch) {
        currentTask.completedDate = dateMatch[1]
      }
    }
    
    // Check for status
    if (line.includes('Status:') && currentTask) {
      if (line.toLowerCase().includes('completed')) {
        currentTask.status = 'completed'
      } else if (line.toLowerCase().includes('progress')) {
        currentTask.status = 'in-progress'
      }
    }
  }
  
  // Add the last section
  if (currentSection && currentSection.tasks.length > 0) {
    sections.push(currentSection)
  }
  
  // Also parse "Next Steps" sections
  const nextStepsMatch = content.match(/## Next Steps[\s\S]*?(?=##|$)/gi)
  if (nextStepsMatch) {
    nextStepsMatch.forEach(match => {
      const steps = match.split('\n')
        .filter(line => {
          const trimmed = line.trim()
          return trimmed.match(/^\d+\./) || trimmed.startsWith('-') || trimmed.startsWith('*')
        })
        .filter(line => line.trim().length > 0)
      
      if (steps.length > 0) {
        const nextStepsSection: TaskSection = {
          title: `${fileName} - Future Enhancements`,
          tasks: []
        }
        
        steps.forEach((step, index) => {
          const cleanStep = step.replace(/^\d+\.\s*|-\s*/, '').trim()
          if (cleanStep && cleanStep.length > 0) {
            nextStepsSection.tasks.push({
              id: `next-${fileName}-${index}`,
              title: cleanStep,
              status: 'pending',
              category: 'Future Enhancement',
              priority: index < 3 ? 'high' : index < 6 ? 'medium' : 'low'
            })
          }
        })
        
        if (nextStepsSection.tasks.length > 0) {
          sections.push(nextStepsSection)
        }
      }
    })
  }
  
  return sections
}