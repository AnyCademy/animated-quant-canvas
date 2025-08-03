import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Function-based manual chunking for more granular control
        manualChunks: (id) => {
          // Node modules chunking
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') && !id.includes('@radix-ui')) {
              if (id.includes('react-router')) return 'router-vendor';
              if (id.includes('react-dom')) return 'react-vendor';
              if (id.includes('react/')) return 'react-vendor';
              return 'react-misc-vendor';
            }
            
            // Radix UI - split by functionality
            if (id.includes('@radix-ui')) {
              if (id.includes('dialog') || id.includes('dropdown') || id.includes('select') || id.includes('tabs')) {
                return 'ui-core-vendor';
              }
              if (id.includes('navigation') || id.includes('context-menu') || id.includes('menubar') || id.includes('tooltip')) {
                return 'ui-navigation-vendor';
              }
              if (id.includes('checkbox') || id.includes('radio') || id.includes('slider') || id.includes('switch') || id.includes('toggle')) {
                return 'form-vendor';
              }
              return 'ui-layout-vendor';
            }
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-libs-vendor';
            }
            
            // Large libraries get their own chunks
            if (id.includes('recharts')) return 'chart-vendor';
            if (id.includes('@supabase')) return 'supabase-vendor';
            if (id.includes('@tanstack/react-query')) return 'query-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            if (id.includes('midtrans-client')) return 'payment-vendor';
            
            // Utility libraries
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
              return 'utils-core-vendor';
            }
            if (id.includes('date-fns') || id.includes('cmdk') || id.includes('embla-carousel') || id.includes('sonner')) {
              return 'utils-misc-vendor';
            }
            
            // Catch-all for other vendor libraries
            return 'vendor';
          }
          
          // App code chunking by route/feature
          if (id.includes('/src/pages/')) {
            if (id.includes('Dashboard') || id.includes('Course') || id.includes('CreateCourse') || id.includes('EditCourse')) {
              return 'pages-dashboard';
            }
            if (id.includes('Auth') || id.includes('PaymentResult')) {
              return 'pages-auth';
            }
            return 'pages-main';
          }
          
          // Component chunking
          if (id.includes('/src/components/')) {
            if (id.includes('ui/')) {
              return 'components-ui';
            }
            if (id.includes('Hero') || id.includes('Features') || id.includes('CTA') || id.includes('Pricing')) {
              return 'components-landing';
            }
            return 'components-shared';
          }
        }
      }
    },
    // Enable more aggressive code splitting
    sourcemap: false, // Disable sourcemaps in production for smaller builds
    target: 'esnext', // Use modern JS features for better optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
        // Additional compression options
        passes: 2,
        unsafe_comps: true,
        unsafe_math: true,
        keep_fargs: false
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    // Split vendor and app code
    cssCodeSplit: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ],
    exclude: [
      'recharts',
      'midtrans-client'
    ]
  },
  // Additional performance optimizations
  esbuild: {
    legalComments: 'none',
    // Remove unused code more aggressively
    treeShaking: true
  }
}));
