"use client"

import { useState, useCallback } from "react";
import { useArticles } from "@/hooks/useArticles";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, ArrowLeft, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyItems } from "@/components/empty-items";
import { useScrollLock } from "@/hooks/useScrollLock";

const UserInfo = ({ author, publishedAt, readTime, size = "default" }) => {
    const avatarSizes = {
        small: "size-5",
        default: "size-8",
        large: "size-10"
    }
    const textSizes = {
        small: "text-xs",
        default: "text-sm",
        large: "text-md"
    }

    return (
        <div className="flex gap-5 max-xs:gap-4">
            <div className="flex items-center gap-2">
                <Avatar className={`${avatarSizes[size]} max-xs:${avatarSizes.small}`}>
                    <AvatarImage src={author.avatar || "/placeholder.svg"} alt={author.name} />
                    <AvatarFallback>
                        <User className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
                <div>
                    <span className={`${textSizes[size]} font-medium max-xs:text-xs`}>
                        {author.name}
                    </span>
                    {publishedAt && (
                        <p className={`${textSizes.small} text-muted-foreground max-xs:text-xs`}>
                            {publishedAt}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className={`size-5`} />
                <span className={`${textSizes[size]} max-xs:text-xs`}>
                    {readTime} min read
                </span>
            </div>
        </div>
    )
}

const TagList = ({ tags, maxTags, className = "" }) => (
    <div className={`flex gap-2 flex-wrap ${className}`}>
        {tags.slice(0, maxTags).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs w-min h-min max-xs:text-xs">
                {tag}
            </Badge>
        ))}
    </div>
)

const ErrorState = ({ message, onRetry }) => (
    <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{message}</p>
        <Button onClick={onRetry}>
            Try Again
        </Button>
    </div>
)

const ArticleCard = ({ article, onRead }) => {
    const handleClick = useCallback(() => onRead(article), [article, onRead])
    return (
        <Card
            className="w-full cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleClick}
        >
            <CardHeader>
                <CardTitle className="text-lg font-bold leading-tight">
                    {article.title}
                </CardTitle>
                <CardDescription className="mt-2 text-sm sm:text-base">
                    {article.description}
                </CardDescription>
                <UserInfo
                    author={article.author}
                    readTime={article.readTime}
                    size="default"
                />
            </CardHeader>
            <CardFooter className="-mt-3">
                <div className="w-full flex flex-col justify-between gap-5">
                    <TagList tags={article.tags} maxTags={3} />
                    <Button className="w-full">Read Article</Button>
                </div>
            </CardFooter>
        </Card>
    )
}

// table of contents for each article
const TableOfContents = ({ sections, onSectionClick, isMobile = false }) => {
    const [isOpen, setIsOpen] = useState(!isMobile)
    const toggleOpen = useCallback(() => setIsOpen(!isOpen), [isOpen])
    const handleSectionClick = useCallback((sectionId) => {
        onSectionClick(sectionId)
        if (isMobile) setIsOpen(false)
    }, [onSectionClick, isMobile])
    return (
        <Card className="mb-5 py-3">
            <CardHeader className="-mb-1">
                <Button
                    variant="ghost"
                    onClick={toggleOpen}
                    className="w-full justify-between p-0 h-auto"
                >
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
                                onClick={() => handleSectionClick(section.id)}
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
    )
}

// Renders article in a list like view
const ArticlesList = ({ articles, onSelectArticle, isLoading, error, refetch }) => {
    useScrollLock(isLoading); 5

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(2)].map((_, index) => (
                    <Skeleton key={index} className="h-70 w-full rounded-lg" />
                ))}
            </div>
        )
    }
    if (error) return <ErrorState message={error.message} onRetry={refetch} />
    if (!articles?.length) return <EmptyItems className="w-full h-full" title="No articles found!" description="currently in progress..." />

    return (
        <div className="grid gap-5">
            {articles.map((article) => (
                <ArticleCard
                    key={article.id}
                    article={article}
                    onRead={onSelectArticle}
                />
            ))}
        </div>
    )
}

// Is reading state/view of the article
const ArticleView = ({ article, onBack }) => {
    const scrollToSection = useCallback((sectionId) => {
        const element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
        }
    }, [])
    return (
        <>
            <div className="@container/header mb-6">
                <Button variant="ghost" onClick={onBack} className="mb-3">
                    <ArrowLeft className="size-4 mr-2" />
                    Back to Articles
                </Button>
                <div className="space-y-4">
                    <h1 className="text-xl font-bold leading-tight max-xs:text-md">
                        {article.title}
                    </h1>
                    <UserInfo
                        author={article.author}
                        publishedAt={article.publishedAt}
                        readTime={article.readTime}
                        size="large"
                    />
                    <TagList tags={article.tags} />
                </div>
            </div>
            <Separator className="mb-5" />
            <TableOfContents
                sections={article.content.sections}
                onSectionClick={scrollToSection}
                isMobile={true}
            />
            <div className="grid grid-cols-1">
                <ArticleContent sections={article.content.sections} />
                <Separator className="my-5" />
                <ArticleSources sources={article.sources} />
            </div>
        </>
    )
}

const ArticleContent = ({ sections }) => (
    <article>
        {sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-5">
                <h2 className="text-2xl font-semibold mb-3 max-xs:text-md">
                    {section.title}
                </h2>
                <div className="text-muted-foreground leading-relaxed">
                    <div className="whitespace-pre-line text-md max-xs:text-sm">
                        {section.content}
                    </div>
                </div>
            </section>
        ))}
    </article>
)

const ArticleSources = ({ sources }) => (
    <div className="space-y-3">
        <h3 className="text-lg font-semibold">Sources & References</h3>
        <div className="space-y-3">
            {sources.map((source, index) => (
                <Card key={`${source.url}-${index}`} className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm sm:text-base truncate">
                                {source.title}
                            </h4>
                            {source.author && (
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                    by {source.author}
                                </p>
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
)

// ===== MAIN ARTICLE COMPONENT =====
export function Article({ categoryDirectory }) {
    const [selectedArticle, setSelectedArticle] = useState(null)
    const {
        data: articlesData,
        isLoading,
        error,
        refetch
    } = useArticles(categoryDirectory)

    const handleBack = useCallback(() => setSelectedArticle(null), [])

    if (selectedArticle) {
        return <ArticleView article={selectedArticle} onBack={handleBack} />
    }

    return (
        <ArticlesList
            articles={articlesData?.articles || []}
            onSelectArticle={setSelectedArticle}
            isLoading={isLoading}
            error={error}
            refetch={refetch}
        />
    )
}
// ===== END ARTICLE COMPONENT =====