import { Icon } from './Icon'

interface ComingSoonProps {
  title: string
  description: string
  icon: 'cloud' | 'users' | 'brain' | 'purchase'
  features?: string[]
}

export default function ComingSoon({ title, description, icon, features = [] }: ComingSoonProps) {
  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
            <Icon name={icon === 'cloud' ? 'cloud' : icon === 'users' ? 'users' : icon === 'brain' ? 'brain' : 'purchase'} size={48} className="text-indigo-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">{title}</h2>
          <p className="text-lg text-slate-600 mb-8">{description}</p>
        </div>

        {features.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Icon name="zap" size={18} className="text-indigo-500" />
              Fitur yang Akan Datang
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="check" size={14} className="text-indigo-600" />
                  </div>
                  <p className="text-sm text-slate-700 text-left">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-semibold text-indigo-700">Segera Hadir</span>
          </div>
          <p className="text-sm text-slate-700">
            Fitur ini sedang dalam pengembangan. Kami akan memberitahu Anda ketika sudah tersedia!
          </p>
        </div>
      </div>
    </div>
  )
}
