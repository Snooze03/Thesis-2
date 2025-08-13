"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, User, ArrowLeft, ExternalLink, Loader2 } from "lucide-react"
import { LoadingSpinner } from "./ui/loading-spinner"

export default function Article({ articlesJsonPath }) {
    const [articles, setArticles] = useState([])
    const [selectedArticle, setSelectedArticle] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchArticles = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(articlesJsonPath)

            if (!response.ok) {
                throw new Error("Failed to load articles")
            }

            const data = await response.json()
            setArticles(data.articles)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchArticles()
    }, [])

    if (selectedArticle) {
        return <ArticleView article={selectedArticle} onBack={() => setSelectedArticle(null)} />
    }

    return (
        <ArticlesList
            articles={articles}
            onSelectArticle={setSelectedArticle}
            loading={loading}
            error={error}
            onRetry={fetchArticles}
        />
    )
}

function ArticleCard({ article, onRead }) {
    return (
        <Card className="w-full cursor-pointer hover:shadow-lg transition-shadow" onClick={onRead}>
            <CardHeader>
                <CardTitle className="text-lg font-bold leading-tight">
                    {article.title}
                </CardTitle>
                <CardDescription className="mt-2 text-sm sm:text-base">{article.description}</CardDescription>

                <div className="flex gap-5 mt-2 max-xs:gap-4">
                    <div className="flex items-center gap-2">
                        <Avatar className="size-8 max-xs:size-5">
                            <AvatarImage src={article.author.avatar || "/placeholder.svg"} alt={article.author.name} />
                            <AvatarFallback>
                                <User className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium max-xs:text-xs">{article.author.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-5 max-xs:size-3" />
                        <span className="text-sm max-xs:text-xs">{article.readTime} min read</span>
                    </div>
                </div>
            </CardHeader>

            <CardFooter className="-mt-3">
                <div className="w-full flex flex-col justify-between gap-5">
                    <div className="flex gap-3 items-center flex-wrap">
                        {article.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs w-min h-min">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <Button className="w-full">
                        Read Article
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}

function ErrorMessage({ message, onRetry }) {
    return (
        <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{message}</p>
            <Button onClick={onRetry} variant="outline">
                Try Again
            </Button>
        </div>
    )
}

function ArticlesList({ articles, onSelectArticle, loading, error, onRetry }) {
    const filteredArticles = articles

    return (
        <>
            {loading && <LoadingSpinner />}

            {error && <ErrorMessage message={error} onRetry={onRetry} />}

            {!loading && !error && (
                <div className="grid gap-5">
                    {filteredArticles.length > 0 ? (
                        filteredArticles.map((article) => (
                            <ArticleCard key={article.id} article={article} onRead={() => onSelectArticle(article)} />
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No articles found matching your search.</p>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

function TableOfContents({ sections, onSectionClick, isMobile = false }) {
    const [isOpen, setIsOpen] = useState(!isMobile)

    return (
        <Card className="mb-5 py-3">
            <CardHeader className="-mb-1">
                <Button variant="ghost" onClick={() => setIsOpen(!isOpen)} className="w-full justify-between p-0 h-auto">
                    <CardTitle className="text-base">Table of Contents</CardTitle>
                    <span className="text-sm">{isOpen ? "−" : "+"}</span>
                </Button>
            </CardHeader>
            {isOpen && (
                <CardContent className="-mt-5">
                    <nav className="space-y-1">
                        {sections.map((section, index) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    onSectionClick(section.id)
                                    setIsOpen(false)
                                }}
                                className="block w-full text-left p-1 rounded-md hover:bg-muted transition-colors text-sm"
                            >
                                <span className="text-muted-foreground mr-2">{index + 1}.</span>
                                {section.title}
                            </button>
                        ))}
                    </nav>
                </CardContent>
            )}
        </Card>
    );
}

function ArticleView({ article, onBack }) {
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
        }
    }

    return (
        <>
            <div className="@container/header mb-6">
                <Button variant="ghost" onClick={onBack} className="mb-3">
                    <ArrowLeft className="size-4 mr-2" />
                    Back to Articles
                </Button>

                <div className="space-y-4">
                    <h1 className="text-xl font-bold leading-tight max-xs:text-md">{article.title}</h1>

                    <div className="flex gap-5 ">
                        <div className="flex items-center gap-2">
                            <Avatar className="size-10 @max-xs/header:size-8  ">
                                <AvatarImage src={article.author.avatar || "/placeholder.svg"} alt={article.author.name} />
                                <AvatarFallback>
                                    <User />
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium max-xs:text-sm">{article.author.name}</p>
                                <p className="text-sm text-muted-foreground max-xs:text-xs">{article.publishedAt}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="size-5 max-xs:size-4" />
                            <span className="text-md max-xs:text-sm">{article.readTime} min read</span>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {article.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-sm max-xs:text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            <Separator className="mb-5" />

            <TableOfContents sections={article.content.sections} onSectionClick={scrollToSection} isMobile={true} />

            <div className="grid grid-cols-1">
                <article>
                    {article.content.sections.map((section) => (
                        <section key={section.id} id={section.id} className="mb-5">
                            <h2 className="text-2xl font-semibold mb-3 max-xs:text-md">{section.title}</h2>
                            <div className="text-muted-foreground leading-relaxed">
                                <div className="whitespace-pre-line text-md max-xs:text-sm">{section.content}</div>
                            </div>
                        </section>
                    ))}
                </article>

                <Separator className="my-5" />

                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Sources & References</h3>
                    <div className="space-y-3">
                        {article.sources.map((source, index) => (
                            <Card key={index} className="p-3 sm:p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm sm:text-base truncate">{source.title}</h4>
                                        {source.author && (
                                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">by {source.author}</p>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}