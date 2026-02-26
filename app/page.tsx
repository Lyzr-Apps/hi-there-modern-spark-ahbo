'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent, extractText } from '@/lib/aiAgent'
import { uploadAndTrainDocument, getDocuments, deleteDocuments } from '@/lib/ragKnowledgeBase'
import type { RAGDocument } from '@/lib/ragKnowledgeBase'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiSearch, FiMessageCircle, FiSend, FiX, FiArrowLeft, FiMail, FiUpload, FiFile, FiTrash2, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi'
import { HiOutlineAcademicCap, HiOutlineCube, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import { BsCircleFill } from 'react-icons/bs'

// ============================================================
// CONSTANTS
// ============================================================

const TEAM_INFO_AGENT_ID = '699ff0b6510416af3e2a7ce6'
const INQUIRY_AGENT_ID = '699ff0d0509dca78ad07eef6'
const RAG_ID = '699ff0a900c2d274880efcbb'

// ============================================================
// TYPES
// ============================================================

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  expertise: string[]
  availability: 'available' | 'busy' | 'unavailable'
  courses: string[]
  agents: string[]
  avatar: string
  email: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  timestamp: string
}

interface InquiryForm {
  name: string
  email: string
  interestType: string
  message: string
}

interface InquiryStatus {
  type: 'success' | 'error' | ''
  message: string
}

// ============================================================
// HARDCODED TEAM DATA
// ============================================================

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    role: 'Lead AI Architect',
    bio: 'Rajesh leads the AI architecture team with over 12 years of experience in machine learning and distributed systems. He specializes in designing scalable agent frameworks and has published research on multi-agent orchestration patterns.',
    expertise: ['Agent Architecture', 'Multi-Agent Systems', 'LLM Fine-tuning', 'System Design'],
    availability: 'available',
    courses: ['Advanced Agent Design Patterns', 'Building Multi-Agent Workflows'],
    agents: ['Enterprise RAG Agent', 'Code Review Agent'],
    avatar: 'RK',
    email: 'rajesh@lyzr.ai'
  },
  {
    id: '2',
    name: 'Priya Sharma',
    role: 'Senior Solutions Engineer',
    bio: 'Priya bridges the gap between complex AI capabilities and real-world business solutions. With expertise in NLP and conversational AI, she designs agent solutions that transform customer experiences across industries.',
    expertise: ['NLP', 'Conversational AI', 'Solution Architecture', 'Customer Experience'],
    availability: 'available',
    courses: ['Conversational AI Masterclass', 'NLP for Business Applications'],
    agents: ['Customer Support Agent', 'Sales Assistant Agent'],
    avatar: 'PS',
    email: 'priya@lyzr.ai'
  },
  {
    id: '3',
    name: 'Arjun Mehta',
    role: 'AI Research Engineer',
    bio: 'Arjun focuses on pushing the boundaries of what AI agents can achieve. His research in reinforcement learning and autonomous systems has led to breakthrough approaches in agent decision-making and self-improvement.',
    expertise: ['Reinforcement Learning', 'Autonomous Agents', 'Research', 'Python'],
    availability: 'busy',
    courses: ['Intro to Reinforcement Learning for Agents'],
    agents: ['Research Assistant Agent', 'Data Analysis Agent'],
    avatar: 'AM',
    email: 'arjun@lyzr.ai'
  },
  {
    id: '4',
    name: 'Sneha Patel',
    role: 'Full-Stack AI Developer',
    bio: 'Sneha combines full-stack development expertise with AI integration skills. She builds end-to-end applications that seamlessly incorporate intelligent agents, from frontend interfaces to backend agent orchestration.',
    expertise: ['Full-Stack Development', 'React', 'Next.js', 'Agent Integration'],
    availability: 'available',
    courses: ['Full-Stack AI App Development', 'Next.js with AI Agents'],
    agents: ['UI Builder Agent', 'Workflow Automation Agent'],
    avatar: 'SP',
    email: 'sneha@lyzr.ai'
  },
  {
    id: '5',
    name: 'Vikram Singh',
    role: 'DevOps & ML Infrastructure Lead',
    bio: 'Vikram ensures that AI agents run reliably at scale. He architects the infrastructure that powers agent deployments, from containerized microservices to real-time monitoring and auto-scaling solutions.',
    expertise: ['MLOps', 'Kubernetes', 'CI/CD', 'Cloud Infrastructure'],
    availability: 'available',
    courses: ['MLOps for Agent Deployment', 'Scaling AI Infrastructure'],
    agents: ['Deployment Monitor Agent', 'Infrastructure Health Agent'],
    avatar: 'VS',
    email: 'vikram@lyzr.ai'
  },
  {
    id: '6',
    name: 'Ananya Desai',
    role: 'AI Product Manager',
    bio: "Ananya translates market needs into AI product strategies. She leads product development for Lyzr's agent platform, ensuring that every feature delivers measurable value to users and enterprises.",
    expertise: ['Product Management', 'AI Strategy', 'User Research', 'Agile'],
    availability: 'busy',
    courses: ['AI Product Strategy Workshop'],
    agents: ['Product Analytics Agent', 'Feature Prioritization Agent'],
    avatar: 'AD',
    email: 'ananya@lyzr.ai'
  },
  {
    id: '7',
    name: 'Karthik Nair',
    role: 'Knowledge Engineering Specialist',
    bio: 'Karthik specializes in knowledge graphs, RAG systems, and information retrieval. He designs the knowledge infrastructure that makes AI agents truly intelligent and contextually aware.',
    expertise: ['RAG Systems', 'Knowledge Graphs', 'Information Retrieval', 'Vector Databases'],
    availability: 'available',
    courses: ['Building Production RAG Systems', 'Knowledge Graph Fundamentals'],
    agents: ['Knowledge Base Agent', 'Document QA Agent'],
    avatar: 'KN',
    email: 'karthik@lyzr.ai'
  },
  {
    id: '8',
    name: 'Meera Iyer',
    role: 'AI Safety & Ethics Lead',
    bio: 'Meera ensures that AI agents are built responsibly. She leads initiatives in AI safety, bias detection, and ethical AI deployment, making sure every agent meets the highest standards of trustworthiness.',
    expertise: ['AI Safety', 'Ethics in AI', 'Bias Detection', 'Responsible AI'],
    availability: 'available',
    courses: ['Responsible AI Development', 'AI Safety Best Practices'],
    agents: ['Content Moderation Agent', 'Bias Detection Agent'],
    avatar: 'MI',
    email: 'meera@lyzr.ai'
  }
]

// Sample chat messages for sample data mode
const sampleChatMessages: ChatMessage[] = [
  { id: 's1', role: 'user', text: 'Who specializes in RAG systems?', timestamp: '10:30 AM' },
  { id: 's2', role: 'agent', text: 'Karthik Nair is our Knowledge Engineering Specialist who focuses on RAG systems, knowledge graphs, information retrieval, and vector databases. He offers courses on Building Production RAG Systems and Knowledge Graph Fundamentals.', timestamp: '10:31 AM' },
  { id: 's3', role: 'user', text: 'What courses does Priya offer?', timestamp: '10:35 AM' },
  { id: 's4', role: 'agent', text: 'Priya Sharma, our Senior Solutions Engineer, offers two courses: Conversational AI Masterclass and NLP for Business Applications. She specializes in NLP, conversational AI, and solution architecture.', timestamp: '10:35 AM' },
]

// ============================================================
// AVATAR COLOR MAP
// ============================================================

const avatarColors: Record<string, string> = {
  RK: 'bg-amber-700 text-amber-50',
  PS: 'bg-emerald-700 text-emerald-50',
  AM: 'bg-sky-700 text-sky-50',
  SP: 'bg-rose-700 text-rose-50',
  VS: 'bg-indigo-700 text-indigo-50',
  AD: 'bg-violet-700 text-violet-50',
  KN: 'bg-teal-700 text-teal-50',
  MI: 'bg-orange-700 text-orange-50',
}

// ============================================================
// HELPERS
// ============================================================

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function getAvailabilityColor(availability: string) {
  switch (availability) {
    case 'available':
      return 'text-emerald-500'
    case 'busy':
      return 'text-amber-500'
    case 'unavailable':
      return 'text-red-500'
    default:
      return 'text-gray-400'
  }
}

function getAvailabilityLabel(availability: string) {
  switch (availability) {
    case 'available':
      return 'Available'
    case 'busy':
      return 'Busy'
    case 'unavailable':
      return 'Unavailable'
    default:
      return 'Unknown'
  }
}

// ============================================================
// ERROR BOUNDARY
// ============================================================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// SUB-COMPONENTS (defined as functions, no export)
// ============================================================

function TeamCard({
  member,
  onClick,
}: {
  member: TeamMember
  onClick: () => void
}) {
  return (
    <Card
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border/40 bg-card"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0',
              avatarColors[member.avatar] || 'bg-primary text-primary-foreground'
            )}
          >
            {member.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif text-lg font-semibold text-foreground truncate">
                {member.name}
              </h3>
              <BsCircleFill
                className={cn('w-2.5 h-2.5 shrink-0', getAvailabilityColor(member.availability))}
              />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{member.role}</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.isArray(member.expertise) &&
                member.expertise.slice(0, 3).map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="text-xs font-normal px-2 py-0.5 bg-secondary text-secondary-foreground"
                  >
                    {skill}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfileDetail({
  member,
  onBack,
  onInquiry,
}: {
  member: TeamMember
  onBack: () => void
  onInquiry: () => void
}) {
  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-1">
          <Card className="border border-border/40 bg-card">
            <CardContent className="p-8 text-center">
              <div
                className={cn(
                  'w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold mx-auto mb-4',
                  avatarColors[member.avatar] || 'bg-primary text-primary-foreground'
                )}
              >
                {member.avatar}
              </div>
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">
                {member.name}
              </h2>
              <p className="text-muted-foreground mb-3">{member.role}</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <BsCircleFill
                  className={cn('w-2.5 h-2.5', getAvailabilityColor(member.availability))}
                />
                <span className="text-sm text-muted-foreground">
                  {getAvailabilityLabel(member.availability)}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                <FiMail className="w-4 h-4" />
                <span>{member.email}</span>
              </div>
              <Button
                onClick={onInquiry}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <HiOutlineChatBubbleLeftRight className="w-4 h-4 mr-2" />
                Connect & Inquire
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <Card className="border border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{member.bio}</p>
            </CardContent>
          </Card>

          {/* Expertise */}
          <Card className="border border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(member.expertise) &&
                  member.expertise.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="px-3 py-1 text-sm bg-secondary text-secondary-foreground"
                    >
                      {skill}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Courses */}
          <Card className="border border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <HiOutlineAcademicCap className="w-5 h-5 text-accent" />
                Courses Offered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(member.courses) &&
                  member.courses.map((course) => (
                    <div
                      key={course}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/20"
                    >
                      <HiOutlineAcademicCap className="w-5 h-5 text-accent shrink-0" />
                      <span className="text-sm font-medium text-foreground">{course}</span>
                    </div>
                  ))}
                {(!Array.isArray(member.courses) || member.courses.length === 0) && (
                  <p className="text-sm text-muted-foreground">No courses currently offered.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agents */}
          <Card className="border border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <HiOutlineCube className="w-5 h-5 text-accent" />
                Agent Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(member.agents) &&
                  member.agents.map((agent) => (
                    <div
                      key={agent}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/20"
                    >
                      <HiOutlineCube className="w-5 h-5 text-accent shrink-0" />
                      <span className="text-sm font-medium text-foreground">{agent}</span>
                    </div>
                  ))}
                {(!Array.isArray(member.agents) || member.agents.length === 0) && (
                  <p className="text-sm text-muted-foreground">No agents currently listed.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ChatPanel({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  chatInput,
  setChatInput,
  chatLoading,
}: {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  onSendMessage: () => void
  chatInput: string
  setChatInput: (val: string) => void
  chatLoading: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, chatLoading])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border/40 shadow-xl flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <FiMessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-foreground">Team Assistant</h3>
              <p className="text-xs text-muted-foreground">Ask about team members, courses, or agents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <FiX className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !chatLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <FiMessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Ask anything about our team.</p>
              <p className="text-xs mt-1">Expertise, courses, agents, and more.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-4 py-3',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                )}
              >
                {msg.role === 'agent' ? renderMarkdown(msg.text) : (
                  <p className="text-sm">{msg.text}</p>
                )}
                <p className={cn('text-[10px] mt-1.5', msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-lg px-4 py-3 rounded-bl-sm">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/30 bg-card">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about our team..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSendMessage()
                }
              }}
              disabled={chatLoading}
              className="flex-1 bg-background border-border/40"
            />
            <Button
              onClick={onSendMessage}
              disabled={!chatInput.trim() || chatLoading}
              size="icon"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              <FiSend className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function KnowledgeBasePanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [documents, setDocuments] = useState<RAGDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    const res = await getDocuments(RAG_ID)
    if (res.success && Array.isArray(res.documents)) {
      setDocuments(res.documents)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchDocs()
    }
  }, [isOpen, fetchDocs])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setUploadStatus({ type: '', message: '' })
    const res = await uploadAndTrainDocument(RAG_ID, file)
    if (res.success) {
      setUploadStatus({ type: 'success', message: `${file.name} uploaded and trained successfully.` })
      await fetchDocs()
    } else {
      setUploadStatus({ type: 'error', message: res.error || 'Upload failed. Please try again.' })
    }
    setLoading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (fileName: string) => {
    setLoading(true)
    const res = await deleteDocuments(RAG_ID, [fileName])
    if (res.success) {
      setUploadStatus({ type: 'success', message: `${fileName} removed.` })
      await fetchDocs()
    } else {
      setUploadStatus({ type: 'error', message: res.error || 'Delete failed.' })
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Knowledge Base</DialogTitle>
          <DialogDescription>
            Upload documents (PDF, DOCX, TXT) to train the Team Info Agent.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Upload area */}
          <div
            className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to upload a document</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleUpload}
              className="hidden"
            />
          </div>

          {/* Status */}
          {uploadStatus.type === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
              <FiCheck className="w-4 h-4 shrink-0" />
              {uploadStatus.message}
            </div>
          )}
          {uploadStatus.type === 'error' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              {uploadStatus.message}
            </div>
          )}

          {/* Document list */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Documents</h4>
            {loading && (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {!loading && documents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No documents yet.</p>
            )}
            {!loading && documents.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/20"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FiFile className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate">{doc.fileName}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.fileName)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InquiryModal({
  isOpen,
  onClose,
  member,
}: {
  isOpen: boolean
  onClose: () => void
  member: TeamMember | null
}) {
  const [formData, setFormData] = useState<InquiryForm>({
    name: '',
    email: '',
    interestType: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<InquiryStatus>({ type: '', message: '' })
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!member) return
    if (!formData.name || !formData.email || !formData.interestType || !formData.message) return

    setLoading(true)
    setStatus({ type: '', message: '' })
    setActiveAgentId(INQUIRY_AGENT_ID)

    const msgBody = `Please send an inquiry email with the following details:
- Visitor Name: ${formData.name}
- Visitor Email: ${formData.email}
- Interest Type: ${formData.interestType}
- Message: ${formData.message}
- Team Member: ${member.name}
- Send to: ${member.email}`

    try {
      const result = await callAIAgent(msgBody, INQUIRY_AGENT_ID)
      if (result.success) {
        const agentStatus = result.response?.result?.status || ''
        const agentMsg =
          result.response?.result?.message ||
          result.response?.message ||
          extractText(result.response) ||
          ''
        if (agentStatus.toLowerCase().includes('fail') || agentStatus.toLowerCase().includes('error')) {
          setStatus({ type: 'error', message: agentMsg || 'Failed to send. Please try again.' })
        } else {
          setStatus({ type: 'success', message: agentMsg || 'Your inquiry has been sent successfully!' })
          setFormData({ name: '', email: '', interestType: '', message: '' })
        }
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Failed to send. Please try again.',
        })
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', email: '', interestType: '', message: '' })
    setStatus({ type: '', message: '' })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            Connect with {member?.name ?? 'Team Member'}
          </DialogTitle>
          <DialogDescription>
            Send an inquiry to learn more about their expertise, courses, or agents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="inquiry-name" className="text-sm font-medium">
              Your Name *
            </Label>
            <Input
              id="inquiry-name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1 bg-background"
            />
          </div>
          <div>
            <Label htmlFor="inquiry-email" className="text-sm font-medium">
              Your Email *
            </Label>
            <Input
              id="inquiry-email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className="mt-1 bg-background"
            />
          </div>
          <div>
            <Label htmlFor="inquiry-interest" className="text-sm font-medium">
              Interest Type *
            </Label>
            <Select
              value={formData.interestType}
              onValueChange={(val) => setFormData((prev) => ({ ...prev, interestType: val }))}
            >
              <SelectTrigger className="mt-1 bg-background">
                <SelectValue placeholder="Select your interest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Course">Course</SelectItem>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Consultation">Consultation</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="inquiry-message" className="text-sm font-medium">
              Message *
            </Label>
            <Textarea
              id="inquiry-message"
              placeholder="Tell us what you're interested in..."
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              rows={4}
              className="mt-1 bg-background"
            />
          </div>

          {/* Status messages */}
          {status.type === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
              <FiCheck className="w-4 h-4 shrink-0" />
              {status.message}
            </div>
          )}
          {status.type === 'error' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              {status.message}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.email || !formData.interestType || !formData.message}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <>
                <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <FiSend className="w-4 h-4 mr-2" />
                Submit Inquiry
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    {
      id: TEAM_INFO_AGENT_ID,
      name: 'Team Info Agent',
      purpose: 'Answers questions about team members via knowledge base',
    },
    {
      id: INQUIRY_AGENT_ID,
      name: 'Inquiry Handler Agent',
      purpose: 'Sends inquiry emails via Gmail integration',
    },
  ]

  return (
    <Card className="border border-border/40 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-sm">Powered By</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-3 p-2 rounded-lg"
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  activeAgentId === agent.id
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-muted-foreground/30'
                )}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{agent.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function Page() {
  // View state
  const [view, setView] = useState<'directory' | 'profile'>('directory')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sampleData, setSampleData] = useState(false)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Inquiry state
  const [inquiryOpen, setInquiryOpen] = useState(false)

  // Knowledge base state
  const [kbOpen, setKbOpen] = useState(false)

  // Agent tracking
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // When sample data toggled on, populate chat
  useEffect(() => {
    if (sampleData) {
      setChatMessages(sampleChatMessages)
    } else {
      setChatMessages([])
    }
  }, [sampleData])

  // Filtered members
  const filteredMembers = teamMembers.filter((member) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      member.name.toLowerCase().includes(q) ||
      member.role.toLowerCase().includes(q) ||
      (Array.isArray(member.expertise) && member.expertise.some((e) => e.toLowerCase().includes(q)))
    )
  })

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member)
    setView('profile')
  }

  const handleBackToDirectory = () => {
    setView('directory')
    setSelectedMember(null)
  }

  const handleSendChat = async () => {
    const text = chatInput.trim()
    if (!text) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: timeStr,
    }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    setActiveAgentId(TEAM_INFO_AGENT_ID)

    try {
      const result = await callAIAgent(text, TEAM_INFO_AGENT_ID)
      const agentText = result.success
        ? result.response?.result?.response ||
          result.response?.message ||
          extractText(result.response) ||
          'No response received.'
        : result.error || 'Sorry, something went wrong. Please try again.'

      const agentNow = new Date()
      const agentTimeStr = agentNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'agent',
        text: agentText,
        timestamp: agentTimeStr,
      }
      setChatMessages((prev) => [...prev, agentMsg])
    } catch {
      const errMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'agent',
        text: 'Network error. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setChatMessages((prev) => [...prev, errMsg])
    } finally {
      setChatLoading(false)
      setActiveAgentId(null)
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-30 border-b border-border/30 bg-card/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-xl font-semibold text-foreground tracking-wide">
                  Lyzr Architect
                </h1>
                <Separator orientation="vertical" className="h-6 bg-border/30" />
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Team Directory
                </span>
              </div>

              {/* Right side controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">
                    Sample Data
                  </Label>
                  <Switch
                    id="sample-toggle"
                    checked={sampleData}
                    onCheckedChange={setSampleData}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setKbOpen(true)}
                  className="text-xs hidden sm:flex"
                >
                  <FiUpload className="w-3.5 h-3.5 mr-1.5" />
                  Knowledge Base
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {view === 'directory' && (
            <div>
              {/* Header Section */}
              <div className="mb-8">
                <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
                  Team Directory
                </h2>
                <p className="text-muted-foreground text-sm max-w-2xl">
                  Meet our team of AI architects, engineers, and product leaders. Browse their expertise,
                  explore available courses and agents, or connect directly.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative mb-8 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border/40"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary transition-colors"
                  >
                    <FiX className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Team Grid */}
              {filteredMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMembers.map((member) => (
                    <TeamCard
                      key={member.id}
                      member={member}
                      onClick={() => handleSelectMember(member)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border border-border/40 bg-card">
                  <CardContent className="py-16 text-center">
                    <FiSearch className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground mb-2">No members match your search</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Filter
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Agent Status */}
              <div className="mt-10">
                <AgentStatusPanel activeAgentId={activeAgentId} />
              </div>
            </div>
          )}

          {view === 'profile' && selectedMember && (
            <ProfileDetail
              member={selectedMember}
              onBack={handleBackToDirectory}
              onInquiry={() => setInquiryOpen(true)}
            />
          )}
        </main>

        {/* Floating Chat Button */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
            style={{ marginBottom: '48px' }}
          >
            <FiMessageCircle className="w-6 h-6" />
          </button>
        )}

        {/* Chat Panel */}
        <ChatPanel
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={chatMessages}
          onSendMessage={handleSendChat}
          chatInput={chatInput}
          setChatInput={setChatInput}
          chatLoading={chatLoading}
        />

        {/* Inquiry Modal */}
        <InquiryModal
          isOpen={inquiryOpen}
          onClose={() => setInquiryOpen(false)}
          member={selectedMember}
        />

        {/* Knowledge Base Dialog */}
        <KnowledgeBasePanel
          isOpen={kbOpen}
          onClose={() => setKbOpen(false)}
        />
      </div>
    </ErrorBoundary>
  )
}
