import { createClient } from '@/utils/supabase/client'

const BUCKET = 'logo-images'
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function sanitizeFilename(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-').replace(/-+/g, '-')
}

export function validateLogoImage(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return 'Only JPG, PNG, or WEBP files are allowed.'
    }

    if (file.size > MAX_IMAGE_BYTES) {
        return 'File size must be 10MB or less.'
    }

    return null
}

export async function uploadLogoImage(file: File, scope: 'orders' | 'imports') {
    const validationError = validateLogoImage(file)
    if (validationError) {
        throw new Error(validationError)
    }

    const supabase = createClient()
    const objectPath = `${scope}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`

    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
    })

    if (error) {
        throw new Error(error.message)
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)

    return {
        image_path: objectPath,
        image_url: data.publicUrl,
    }
}

export async function uploadOrderIntakeFormImage(file: File) {
    const validationError = validateLogoImage(file)
    if (validationError) {
        throw new Error(validationError)
    }

    const supabase = createClient()
    const objectPath = `orders/intake-forms/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`

    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
    })

    if (error) {
        throw new Error(error.message)
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)

    return {
        intake_form_image_path: objectPath,
        intake_form_image_url: data.publicUrl,
    }
}
