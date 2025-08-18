import { useQuery } from "@tanstack/react-query"

// Custom hook for fetching articles from a category directory
export const useArticles = (categoryDirectory) => {
    return useQuery({
        queryKey: ['articles', categoryDirectory],
        queryFn: async () => {
            try {
                // First, try to get the list of JSON files in the category directory
                // This assumes you we an index.json file that lists available article files
                const indexResponse = await fetch(`${categoryDirectory}/index.json`)
                if (!indexResponse.ok) {
                    throw new Error(`Could not load articles index from ${categoryDirectory}. Make sure index.json exists in the directory.`)
                }
                const indexData = await indexResponse.json()
                const articleFiles = indexData.files || []

                // Fetch all article files in parallel
                const articlePromises = articleFiles.map(async (fileName) => {
                    try {
                        const response = await fetch(`${categoryDirectory}/${fileName}`)

                        if (!response.ok) {
                            console.warn(`Failed to load ${fileName} from ${categoryDirectory}`)
                            return null
                        }

                        const data = await response.json()

                        // Each file is now a single article object
                        return {
                            ...data,
                            // Ensure unique ID using filename if needed
                            id: data.id || fileName.replace('.json', '')
                        }
                    } catch (error) {
                        console.warn(`Error loading ${fileName} from ${categoryDirectory}:`, error)
                        return null
                    }
                })
                const articles = await Promise.all(articlePromises)
                // Filter out any null/failed articles
                const allArticles = articles.filter(Boolean)

                return {
                    articles: allArticles,
                    totalCount: allArticles.length
                }
            } catch (error) {
                throw new Error(`Failed to load articles from ${categoryDirectory}: ${error.message}`)
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })
}