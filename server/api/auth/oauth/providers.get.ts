import { configuredProviders, upcomingProviders } from '../../../../shared/utils/oauth'

export default defineEventHandler((): IOAuthProviders => {
    return { providers: configuredProviders(process.env), upcoming: upcomingProviders(process.env) }
})
